package com.m4n.backend.service;

import com.m4n.backend.dto.request.*;
import com.m4n.backend.dto.response.EmailOtpResponse;
import com.m4n.backend.exception.InvalidEmailOtpException;
import com.m4n.backend.exception.RegistrationVerificationRequiredException;
import com.m4n.backend.repository.*;
import com.m4n.backend.util.TokenHashUtil;
import org.junit.jupiter.api.*;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.UUID;
import java.util.concurrent.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
class PendingRegistrationIntegrationTest {
    @Autowired EmailOtpService service;
    @Autowired AuthService auth;
    @Autowired EmailOtpChallengeRepository challenges;
    @Autowired UserRepository users;
    @Autowired PasswordEncoder encoder;
    @Autowired RefreshTokenService sessions;
    @Autowired com.m4n.backend.security.JwtService jwt;
    @Autowired WebApplicationContext context;
    @MockitoBean EmailOtpNotifier notifier;
    String email;

    @BeforeAll static void enforceEmailUniqueness(@Autowired javax.sql.DataSource dataSource) {
        var migration = new org.springframework.jdbc.datasource.init.ResourceDatabasePopulator(
                new org.springframework.core.io.FileSystemResource("../docs/migrations/20261016_unique_account_email.sql"));
        migration.execute(dataSource);
        migration.execute(dataSource);
    }

    @BeforeEach void setUp() {
        when(notifier.isAvailable()).thenReturn(true);
        email = "pending-" + UUID.randomUUID() + "@example.test";
    }

    @Test void accountExistsWithHashedPasswordAndVerificationUpdatesSameCustomer() {
        var challenge = start();
        var account = users.findByEmailIgnoreCase(email).orElseThrow();
        assertThat(account.getFullName()).isEqualTo("Pending fixture");
        assertThat(account.getPassword()).isNotEqualTo("Password123!");
        assertThat(encoder.matches("Password123!", account.getPassword())).isTrue();
        assertThat(account.isEmailVerified()).isFalse();
        assertThatThrownBy(() -> auth.login(new LoginRequest(email, "WrongPassword!")))
                .isInstanceOf(BadCredentialsException.class);
        assertThatThrownBy(() -> auth.login(new LoginRequest(email.toUpperCase(), "Password123!")))
                .isInstanceOfSatisfying(RegistrationVerificationRequiredException.class, ex -> {
                    assertThat(ex.getEmail()).isEqualTo(email);
                    assertThat(ex.getChallenge().challengeId()).isEqualTo(challenge.challengeId());
                });
        var verified = service.verifyRegistration(request(challenge, code()));
        assertThat(verified.role()).isEqualTo(com.m4n.backend.entity.RoleName.CUSTOMER);
        assertThat(users.findByEmailIgnoreCase(email).orElseThrow().getPhone()).isEqualTo("0901234567");
        var completed = users.findByEmailIgnoreCase(email).orElseThrow();
        assertThat(completed.getId()).isEqualTo(account.getId());
        assertThat(completed.isEmailVerified()).isTrue();
        assertThat(auth.login(new LoginRequest(email, "Password123!"))).isNotNull();
        assertThatThrownBy(() -> service.verifyRegistration(request(challenge, code()))).isInstanceOf(InvalidEmailOtpException.class);
    }

    @Test void wrongOrExpiredOtpKeepsAccountUnverifiedAndResendPreservesOriginalProfile() {
        var first = start();
        String oldCode = code();
        String wrong = oldCode.equals("000000") ? "111111" : "000000";
        assertThatThrownBy(() -> service.verifyRegistration(request(first, wrong))).isInstanceOf(InvalidEmailOtpException.class);
        assertThat(challenges.findById(key()).orElseThrow().getAttempts()).isEqualTo(1);
        var row = challenges.findById(key()).orElseThrow();
        row.setExpiresAt(Instant.now().minusSeconds(1));
        row.setSentAt(Instant.now().minusSeconds(601));
        challenges.save(row);
        assertThatThrownBy(() -> service.verifyRegistration(request(first, oldCode))).isInstanceOf(InvalidEmailOtpException.class);
        assertThat(users.findByEmailIgnoreCase(email).orElseThrow().isEmailVerified()).isFalse();
        assertThatThrownBy(() -> auth.login(new LoginRequest(email, "Password123!")))
                .isInstanceOf(RegistrationVerificationRequiredException.class);
        var latest = service.requestCode(new EmailOtpRequest(email, "REGISTER"));
        assertThatThrownBy(() -> service.verifyRegistration(request(first, oldCode))).isInstanceOf(InvalidEmailOtpException.class);
        assertThatThrownBy(() -> service.verifyRegistration(request(latest, oldCode))).isInstanceOf(InvalidEmailOtpException.class);
        service.verifyRegistration(request(latest, code()));
        assertThat(auth.login(new LoginRequest(email, "Password123!"))).isNotNull();
        assertThat(users.findByEmailIgnoreCase(email).orElseThrow().getFullName()).isEqualTo("Pending fixture");
    }

    @Test void correctPendingLoginReturnsOnlyVerificationMetadataWithoutSession() throws Exception {
        var challenge = start();
        var mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + email + "\",\"password\":\"WrongPassword!\"}"))
                .andExpect(status().isUnauthorized()).andExpect(jsonPath("$.challenge").doesNotExist());
        mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + email + "\",\"password\":\"Password123!\"}"))
                .andExpect(status().isConflict()).andExpect(header().string("Cache-Control", "no-store"))
                .andExpect(header().doesNotExist("Set-Cookie"))
                .andExpect(jsonPath("$.error").value("REGISTRATION_VERIFICATION_REQUIRED"))
                .andExpect(jsonPath("$.challenge.challengeId").value(challenge.challengeId()))
                .andExpect(jsonPath("$.accessToken").doesNotExist()).andExpect(jsonPath("$.password").doesNotExist());
    }

    @Test void publicStartPersistsUnverifiedAccountAndVerifyAcceptsOnlyProof() throws Exception {
        var mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        mvc.perform(post("/api/v1/auth/register/start").contentType(MediaType.APPLICATION_JSON)
                .content("{\"fullName\":\"Pending fixture\",\"email\":\"" + email + "\",\"password\":\"short\"}"))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/v1/auth/register/start").contentType(MediaType.APPLICATION_JSON)
                .content("{\"fullName\":\"Pending fixture\",\"email\":\"" + email + "\",\"password\":\"Password123!\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.challengeId").isNotEmpty());
        assertThat(users.findByEmailIgnoreCase(email).orElseThrow().isEmailVerified()).isFalse();
        var row = challenges.findById(key()).orElseThrow();
        mvc.perform(post("/api/v1/auth/register/verify").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + email + "\",\"challengeId\":\"" + row.getChallengeId() + "\",\"code\":\"" + code() + "\"}"))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.email").value(email))
                .andExpect(jsonPath("$.role").value("CUSTOMER")).andExpect(jsonPath("$.password").doesNotExist());
    }

    @Test void concurrentVerificationVerifiesExistingCustomerOnlyOnce() throws Exception {
        var challenge = start();
        var request = request(challenge, code());
        var gate = new CountDownLatch(1);
        try (var pool = Executors.newFixedThreadPool(2)) {
            Callable<Boolean> call = () -> { gate.await(); try { service.verifyRegistration(request); return true; }
                catch (InvalidEmailOtpException ex) { return false; } };
            var first = pool.submit(call);
            var second = pool.submit(call);
            gate.countDown();
            assertThat(first.get(10, TimeUnit.SECONDS) ^ second.get(10, TimeUnit.SECONDS)).isTrue();
        }
        assertThat(users.findByEmailIgnoreCase(email)).isPresent();
    }

    @Test void failedInitialDeliveryRollsBackAccountAndChallenge() {
        doThrow(new ResponseStatusException(org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE))
                .when(notifier).sendCode(eq(email), anyString(), eq("REGISTER"));
        assertThatThrownBy(this::start).isInstanceOf(ResponseStatusException.class);
        assertThat(challenges.findById(key())).isEmpty();
        assertThat(users.existsByEmailIgnoreCase(email)).isFalse();
    }

    @Test void existingUsersAndOversizedUtf8PasswordsCannotStartPendingRegistration() {
        auth.register(new RegisterRequest("Existing", email, "Password123!", null));
        assertThatThrownBy(this::start).isInstanceOf(com.m4n.backend.exception.DuplicateResourceException.class);
        email = "utf8-" + email;
        assertThatThrownBy(() -> service.startRegistration(new RegisterRequest("UTF8", email, "ế".repeat(30), null)))
                .isInstanceOf(IllegalArgumentException.class);
        verify(notifier, never()).sendCode(eq(email), anyString(), anyString());
    }

    @Test void unverifiedAccountsCannotCreateOrRotateSessionsOrUseJwt() throws Exception {
        auth.register(new RegisterRequest("Session fixture", email, "Password123!", null));
        var user = users.findByEmailIgnoreCase(email).orElseThrow();
        var existing = sessions.createRefreshToken(user, null, null);
        String token = jwt.generateToken(user.getId(), email, user.getRole().getName(), user.getSessionVersion());
        user.setEmailVerified(false);
        users.saveAndFlush(user);
        assertThatThrownBy(() -> sessions.createRefreshToken(user, null, null))
                .isInstanceOf(org.springframework.security.authentication.DisabledException.class);
        assertThatThrownBy(() -> sessions.rotateRefreshToken(existing.rawRefreshToken(), null, null))
                .isInstanceOf(org.springframework.security.authentication.DisabledException.class);
        MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build()
                .perform(get("/api/v1/auth/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isUnauthorized());
    }

    @Test void repeatedRegistrationCannotOverwriteUnverifiedAccountCredentials() {
        start();
        var original = users.findByEmailIgnoreCase(email).orElseThrow();
        assertThatThrownBy(() -> service.startRegistration(new RegisterRequest("Changed", email, "Attacker123!", null)))
                .isInstanceOf(com.m4n.backend.exception.DuplicateResourceException.class);
        var retained = users.findByEmailIgnoreCase(email).orElseThrow();
        assertThat(retained.getId()).isEqualTo(original.getId());
        assertThat(retained.getFullName()).isEqualTo("Pending fixture");
        assertThat(retained.getPassword()).isEqualTo(original.getPassword());
        assertThat(retained.isEmailVerified()).isFalse();
    }

    @Test void verifiedAndUnverifiedEmailsAreUniqueIgnoringCaseAndSurroundingSpaces() throws Exception {
        var challenge = start();
        var original = users.findByEmailIgnoreCase(email).orElseThrow();
        var mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        String duplicate = "{\"fullName\":\"Duplicate\",\"email\":\"" + email.toUpperCase(java.util.Locale.ROOT)
                + "\",\"password\":\"OtherPassword123!\"}";
        mvc.perform(post("/api/v1/auth/register/start").contentType(MediaType.APPLICATION_JSON).content(duplicate))
                .andExpect(status().isConflict()).andExpect(jsonPath("$.error").value("EMAIL_ALREADY_EXISTS"));
        assertThatThrownBy(() -> service.startRegistration(new RegisterRequest("Duplicate", " " + email + " ", "OtherPassword123!", null)))
                .isInstanceOf(com.m4n.backend.exception.DuplicateResourceException.class);
        service.verifyRegistration(request(challenge, code()));
        mvc.perform(post("/api/v1/auth/register/start").contentType(MediaType.APPLICATION_JSON).content(duplicate))
                .andExpect(status().isConflict()).andExpect(jsonPath("$.error").value("EMAIL_ALREADY_EXISTS"));
        assertThat(users.findByEmailIgnoreCase(email).orElseThrow().getId()).isEqualTo(original.getId());
        verify(notifier, times(1)).sendCode(eq(email), anyString(), eq("REGISTER"));
    }

    @Test void databaseRejectsCaseOrWhitespaceVariantsEvenWhenServiceIsBypassed() {
        start();
        var original = users.findByEmailIgnoreCase(email).orElseThrow();
        var duplicate = com.m4n.backend.entity.User.builder().email(" " + email.toUpperCase(java.util.Locale.ROOT) + " ")
                .password(original.getPassword()).fullName("Duplicate").role(original.getRole()).build();
        assertThatThrownBy(() -> users.saveAndFlush(duplicate))
                .isInstanceOf(org.springframework.dao.DataIntegrityViolationException.class);
        assertThat(users.findByEmailIgnoreCase(email).orElseThrow().getId()).isEqualTo(original.getId());
    }

    @Test void concurrentStartsWithSameEmailPersistOnlyOneAccountAndSendOneOtp() throws Exception {
        var gate = new CountDownLatch(1);
        try (var pool = Executors.newFixedThreadPool(2)) {
            Callable<Boolean> call = () -> { gate.await(); try { start(); return true; }
                catch (com.m4n.backend.exception.DuplicateResourceException | org.springframework.dao.DataIntegrityViolationException ex) {
                    return false;
                } };
            var first = pool.submit(call);
            var second = pool.submit(call);
            gate.countDown();
            assertThat(first.get(15, TimeUnit.SECONDS) ^ second.get(15, TimeUnit.SECONDS)).isTrue();
        }
        assertThat(users.findByEmailIgnoreCase(email)).isPresent();
        verify(notifier, times(1)).sendCode(eq(email), anyString(), eq("REGISTER"));
    }

    private EmailOtpResponse start() {
        return service.startRegistration(new RegisterRequest(" Pending fixture ", email, "Password123!", "0901234567"));
    }
    private VerifyRegistrationRequest request(EmailOtpResponse challenge, String code) {
        return new VerifyRegistrationRequest(email, challenge.challengeId(), code);
    }
    private String key() { return TokenHashUtil.hashToken("REGISTER:" + email); }
    private String code() {
        var captured = ArgumentCaptor.forClass(String.class);
        verify(notifier, atLeastOnce()).sendCode(eq(email), captured.capture(), eq("REGISTER"));
        return captured.getValue();
    }
}
