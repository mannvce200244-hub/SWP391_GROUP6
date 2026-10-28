package com.m4n.backend.service;

import com.m4n.backend.dto.request.*;
import com.m4n.backend.dto.response.EmailOtpResponse;
import com.m4n.backend.dto.response.VerifiedResetOtpResponse;
import com.m4n.backend.exception.InvalidEmailOtpException;
import com.m4n.backend.repository.*;
import com.m4n.backend.util.TokenHashUtil;
import org.junit.jupiter.api.*;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.http.MediaType;

import java.time.Instant;
import java.util.UUID;
import java.util.concurrent.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
class ResetOtpVerificationIntegrationTest {
    @Autowired EmailOtpService service;
    @Autowired AuthService auth;
    @Autowired EmailOtpChallengeRepository challenges;
    @Autowired PasswordResetTokenRepository tokens;
    @Autowired UserRepository users;
    @Autowired WebApplicationContext context;
    @MockitoBean EmailOtpNotifier notifier;
    String email;
    EmailOtpResponse challenge;
    String code;

    @BeforeEach void setUp() {
        when(notifier.isAvailable()).thenReturn(true);
        email = "reset-verify-" + UUID.randomUUID() + "@example.test";
        auth.register(new RegisterRequest("Reset fixture", email, "Password123!", null));
        requestCode();
    }

    @Test void verifiedOtpIssuesHashedCredentialWithoutChangingPasswordUntilFinalSubmit() {
        long generation = users.findByEmailIgnoreCase(email).orElseThrow().getSessionVersion();
        var verified = verifyCode();
        var active = tokens.findAllByUserIdAndUsedAtIsNull(users.findByEmailIgnoreCase(email).orElseThrow().getId());
        assertThat(active).hasSize(1);
        assertThat(active.getFirst().getTokenHash()).isEqualTo(TokenHashUtil.hashToken(verified.token()))
                .isNotEqualTo(verified.token());
        assertThat(verified.expiresAt()).isEqualTo(challenges.findById(key()).orElseThrow().getExpiresAt());
        assertThat(verified.expiresAt()).isCloseTo(challenge.expiresAt(), within(1, java.time.temporal.ChronoUnit.MICROS));
        assertThat(auth.login(new LoginRequest(email, "Password123!"))).isNotNull();
        assertThatThrownBy(this::verifyCode).isInstanceOf(InvalidEmailOtpException.class);
        reset(verified.token());
        assertThat(auth.login(new LoginRequest(email, "NewPassword123!"))).isNotNull();
        assertThat(users.findByEmailIgnoreCase(email).orElseThrow().getSessionVersion()).isGreaterThan(generation);
        assertThatThrownBy(() -> reset(verified.token())).isInstanceOf(BadCredentialsException.class);
    }

    @Test void wrongGuessesPersistAndBlockCorrectCodeAfterFiveAttempts() {
        String wrong = code.equals("000000") ? "111111" : "000000";
        for (int i = 0; i < 5; i++) {
            assertThatThrownBy(() -> service.verifyResetOtp(new VerifyResetOtpRequest(email, challenge.challengeId(), wrong)))
                    .isInstanceOf(InvalidEmailOtpException.class);
        }
        assertThat(challenges.findById(key()).orElseThrow().getAttempts()).isEqualTo(5);
        assertThatThrownBy(this::verifyCode).isInstanceOf(InvalidEmailOtpException.class);
        assertThat(tokens.findAllByUserIdAndUsedAtIsNull(users.findByEmailIgnoreCase(email).orElseThrow().getId())).isEmpty();
    }

    @Test void anonymousHttpVerificationReturnsNonCacheableCredentialAndValidatesInput() throws Exception {
        var mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        mvc.perform(post("/api/v1/auth/verify-reset-otp").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"invalid\",\"challengeId\":\"\",\"code\":\"a\"}"))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/v1/auth/verify-reset-otp").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + email + "\",\"challengeId\":\"" + challenge.challengeId() + "\",\"code\":\"" + code + "\"}"))
                .andExpect(status().isOk()).andExpect(header().string("Cache-Control", "no-store"))
                .andExpect(jsonPath("$.token").isNotEmpty()).andExpect(jsonPath("$.expiresAt").isNotEmpty());
    }

    @Test void expiredChallengeCannotIssueResetCredential() {
        var row = challenges.findById(key()).orElseThrow();
        row.setExpiresAt(Instant.now().minusSeconds(1));
        challenges.save(row);
        assertThatThrownBy(this::verifyCode).isInstanceOf(InvalidEmailOtpException.class);
    }

    @Test void credentialRetainsExpiryAndCannotResetAfterExpiry() {
        var verified = verifyCode();
        var userId = users.findByEmailIgnoreCase(email).orElseThrow().getId();
        var row = tokens.findAllByUserIdAndUsedAtIsNull(userId).getFirst();
        row.setExpiresAt(Instant.now().minusSeconds(1));
        tokens.save(row);
        assertThatThrownBy(() -> reset(verified.token())).isInstanceOf(BadCredentialsException.class);
        assertThat(auth.login(new LoginRequest(email, "Password123!"))).isNotNull();
    }

    @Test void resendRevokesVerifiedCredentialAndOnlyNewestOtpCanProceed() {
        var verified = verifyCode();
        var previous = new VerifyResetOtpRequest(email, challenge.challengeId(), code);
        allowResend();
        requestCode();
        assertThatThrownBy(() -> reset(verified.token())).isInstanceOf(BadCredentialsException.class);
        assertThatThrownBy(() -> service.verifyResetOtp(previous)).isInstanceOf(InvalidEmailOtpException.class);
        assertThatThrownBy(() -> service.verifyResetOtp(new VerifyResetOtpRequest(email, challenge.challengeId(), previous.code())))
                .isInstanceOf(InvalidEmailOtpException.class);
        reset(verifyCode().token());
        assertThat(auth.login(new LoginRequest(email, "NewPassword123!"))).isNotNull();
    }

    @Test void concurrentVerificationIssuesExactlyOneCredential() throws Exception {
        var gate = new CountDownLatch(1);
        try (var pool = Executors.newFixedThreadPool(2)) {
            Callable<Boolean> call = () -> {
                gate.await();
                try { verifyCode(); return true; }
                catch (InvalidEmailOtpException ex) { return false; }
            };
            var first = pool.submit(call);
            var second = pool.submit(call);
            gate.countDown();
            assertThat(first.get(10, TimeUnit.SECONDS) ^ second.get(10, TimeUnit.SECONDS)).isTrue();
        }
        assertThat(tokens.findAllByUserIdAndUsedAtIsNull(users.findByEmailIgnoreCase(email).orElseThrow().getId())).hasSize(1);
    }

    @Test void verificationIsBoundToEmailAndResetPurpose() {
        assertThatThrownBy(() -> service.verifyResetOtp(new VerifyResetOtpRequest("other@example.test", challenge.challengeId(), code)))
                .isInstanceOf(InvalidEmailOtpException.class);
        allowResend();
        var registration = service.requestCode(new EmailOtpRequest(email, "REGISTER"));
        var captured = ArgumentCaptor.forClass(String.class);
        verify(notifier).sendCode(eq(email), captured.capture(), eq("REGISTER"));
        assertThatThrownBy(() -> service.verifyResetOtp(new VerifyResetOtpRequest(email, registration.challengeId(), captured.getValue())))
                .isInstanceOf(InvalidEmailOtpException.class);
    }

    private void requestCode() {
        challenge = service.requestCode(new EmailOtpRequest(email, "RESET_PASSWORD"));
        var captured = ArgumentCaptor.forClass(String.class);
        verify(notifier, atLeastOnce()).sendCode(eq(email), captured.capture(), eq("RESET_PASSWORD"));
        code = captured.getValue();
    }

    private VerifiedResetOtpResponse verifyCode() {
        return service.verifyResetOtp(new VerifyResetOtpRequest(email, challenge.challengeId(), code));
    }

    private void reset(String token) { auth.resetPassword(new ResetPasswordRequest(token, "NewPassword123!", "NewPassword123!")); }
    private String key() { return TokenHashUtil.hashToken("RESET_PASSWORD:" + email); }
    private void allowResend() {
        var row = challenges.findById(key()).orElseThrow();
        row.setSentAt(Instant.now().minusSeconds(61));
        challenges.save(row);
    }
}
