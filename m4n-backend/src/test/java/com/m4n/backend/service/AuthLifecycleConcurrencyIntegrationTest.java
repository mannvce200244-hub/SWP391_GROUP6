package com.m4n.backend.service;

import com.m4n.backend.dto.request.ResetPasswordRequest;
import com.m4n.backend.dto.request.ChangePasswordRequest;
import com.m4n.backend.dto.request.ChangeUserRoleRequest;
import com.m4n.backend.dto.request.LoginRequest;
import com.m4n.backend.dto.request.UpdateUserRequest;
import com.m4n.backend.entity.PasswordResetToken;
import com.m4n.backend.entity.RoleName;
import com.m4n.backend.entity.User;
import com.m4n.backend.repository.PasswordResetTokenRepository;
import com.m4n.backend.repository.RefreshTokenRepository;
import com.m4n.backend.repository.RoleRepository;
import com.m4n.backend.repository.UserRepository;
import com.m4n.backend.util.TokenHashUtil;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.Future;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
class AuthLifecycleConcurrencyIntegrationTest {

    @Autowired private AuthService authService;
    @Autowired private RefreshTokenService refreshTokenService;
    @Autowired private AdminUserService adminUserService;
    @Autowired private UserRepository userRepository;
    @Autowired private RoleRepository roleRepository;
    @Autowired private RefreshTokenRepository refreshTokenRepository;
    @Autowired private PasswordResetTokenRepository passwordResetTokenRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private JdbcTemplate jdbcTemplate;
    @Autowired private PlatformTransactionManager transactionManager;
    @Autowired private WebApplicationContext webContext;

    private User customer;
    private User operator;
    private MockMvc mockMvc;

    @BeforeEach
    void createIsolatedAccounts() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webContext).apply(springSecurity()).build();
        String id = UUID.randomUUID().toString();
        customer = userRepository.saveAndFlush(User.builder()
                .email("auth-customer-" + id + "@m4n.test")
                .fullName("Authentication test customer")
                .password(passwordEncoder.encode("Password123!"))
                .role(roleRepository.findByName(RoleName.CUSTOMER).orElseThrow())
                .isActive(true).build());
        operator = userRepository.saveAndFlush(User.builder()
                .email("auth-operator-" + id + "@m4n.test")
                .fullName("Authentication test admin")
                .password(passwordEncoder.encode("Password123!"))
                .role(roleRepository.findByName(RoleName.ADMIN).orElseThrow())
                .isActive(true).build());
    }

    @AfterEach
    void removeOnlyThisTestsAccounts() {
        for (User user : new User[] {customer, operator}) {
            if (user == null) continue;
            jdbcTemplate.update("DELETE FROM refresh_tokens WHERE user_id = ?", user.getId());
            jdbcTemplate.update("DELETE FROM password_reset_tokens WHERE user_id = ?", user.getId());
            userRepository.deleteById(user.getId());
        }
    }

    @Test
    void refreshReuseCommitsRevocationEvenThoughAuthenticationFails() {
        String original = refreshTokenService.createRefreshToken(customer, "test", "127.0.0.1").rawRefreshToken();
        authService.refresh(original, "test", "127.0.0.1");
        assertThat(refreshTokenRepository.findAllByUserIdAndRevokedAtIsNull(customer.getId())).hasSize(1);

        assertThatThrownBy(() -> authService.refresh(original, "test", "127.0.0.1"))
                .isInstanceOf(BadCredentialsException.class);

        assertThat(refreshTokenRepository.findAllByUserIdAndRevokedAtIsNull(customer.getId())).isEmpty();
    }

    @Test
    void simultaneousRefreshOfOneTokenSucceedsOnceAndRevokesTheReplacementOnReuse() throws Exception {
        String original = refreshTokenService.createRefreshToken(customer, "test", "127.0.0.1").rawRefreshToken();
        List<Boolean> results = runTwice(() -> authService.refresh(original, "test", "127.0.0.1"));

        assertThat(results).containsExactlyInAnyOrder(true, false);
        assertThat(refreshTokenRepository.findAllByUserIdAndRevokedAtIsNull(customer.getId())).isEmpty();
    }

    @Test
    void passwordResetTokenIsConsumedOnlyOnceUnderConcurrentRequests() throws Exception {
        String token = TokenHashUtil.generateSecureRandomToken();
        passwordResetTokenRepository.saveAndFlush(PasswordResetToken.builder()
                .user(customer).tokenHash(TokenHashUtil.hashToken(token))
                .expiresAt(Instant.now().plusSeconds(600)).build());

        List<Boolean> results = runTwice(() -> authService.resetPassword(
                new ResetPasswordRequest(token, "ChangedPassword123!", "ChangedPassword123!")));

        assertThat(results).containsExactlyInAnyOrder(true, false);
        assertThat(passwordResetTokenRepository.findAllByUserIdAndUsedAtIsNull(customer.getId())).isEmpty();
        assertThat(passwordEncoder.matches("ChangedPassword123!", userRepository.findById(customer.getId()).orElseThrow().getPassword())).isTrue();
    }

    @Test
    void managementResponseContainsCommittedVersionForTheNextMutation() {
        var updated = adminUserService.updateUser(customer.getId(),
                new UpdateUserRequest("Updated customer", null, null, customer.getVersion()), operator.getEmail());

        assertThat(updated.version()).isEqualTo(customer.getVersion() + 1);
        var disabled = adminUserService.disableUser(customer.getId(), updated.version(), operator.getEmail());
        assertThat(disabled.version()).isGreaterThan(updated.version());
        assertThat(disabled.version()).isEqualTo(userRepository.findById(customer.getId()).orElseThrow().getVersion());
        assertThat(disabled.isActive()).isFalse();
    }

    @Test
    void rotationCannotEscapeConcurrentLogoutAll() throws Exception {
        assertRotationRevokedBy(() -> authService.logoutAll(customer.getEmail()));
    }

    @Test
    void rotationCannotEscapeConcurrentPasswordChange() throws Exception {
        assertRotationRevokedBy(() -> authService.changePassword(customer.getEmail(),
                new ChangePasswordRequest("Password123!", "ChangedPassword123!", "ChangedPassword123!")));
    }

    @Test
    void rotationCannotEscapeConcurrentPasswordReset() throws Exception {
        String resetToken = createResetToken();
        assertRotationRevokedBy(() -> authService.resetPassword(
                new ResetPasswordRequest(resetToken, "ChangedPassword123!", "ChangedPassword123!")));
    }

    @Test
    void rotationCannotEscapeConcurrentAccountDisable() throws Exception {
        assertRotationRevokedBy(() -> adminUserService.disableUser(
                customer.getId(), customer.getVersion(), operator.getEmail()));
    }

    @Test
    void loginUsingOldPasswordCannotCreateASessionAfterPasswordChange() throws Exception {
        CountDownLatch passwordChanged = new CountDownLatch(1);
        CountDownLatch allowCommit = new CountDownLatch(1);
        AtomicInteger loginPid = new AtomicInteger();
        TransactionTemplate transaction = new TransactionTemplate(transactionManager);
        try (var executor = Executors.newFixedThreadPool(2)) {
            Future<?> change = executor.submit(() -> transaction.executeWithoutResult(status -> {
                authService.changePassword(customer.getEmail(),
                        new ChangePasswordRequest("Password123!", "ChangedPassword123!", "ChangedPassword123!"));
                passwordChanged.countDown();
                await(allowCommit);
            }));
            try {
                assertThat(passwordChanged.await(10, TimeUnit.SECONDS)).isTrue();
                Future<Boolean> login = executor.submit(() -> {
                    try {
                        return transaction.execute(status -> {
                            loginPid.set(jdbcTemplate.queryForObject("SELECT pg_backend_pid()", Integer.class));
                            authService.login(new LoginRequest(customer.getEmail(), "Password123!"));
                            return true;
                        });
                    } catch (BadCredentialsException ex) {
                        return false;
                    }
                });
                waitUntilBlockedOrDone(loginPid, login);
                allowCommit.countDown();
                change.get(15, TimeUnit.SECONDS);
                assertThat(login.get(15, TimeUnit.SECONDS)).isFalse();
                assertThat(refreshTokenRepository.findAllByUserIdAndRevokedAtIsNull(customer.getId())).isEmpty();
            } finally {
                allowCommit.countDown();
            }
        }
    }

    @Test
    void passwordChangeInvalidatesOldAccessTokensImmediately() throws Exception {
        String access = loginAccessToken();
        authService.changePassword(customer.getEmail(),
                new ChangePasswordRequest("Password123!", "ChangedPassword123!", "ChangedPassword123!"));
        assertAccessRejected(access);
    }

    @Test
    void passwordResetInvalidatesOldAccessTokensImmediately() throws Exception {
        String access = loginAccessToken();
        authService.resetPassword(new ResetPasswordRequest(createResetToken(), "ChangedPassword123!", "ChangedPassword123!"));
        assertAccessRejected(access);
    }

    @Test
    void logoutAllInvalidatesOldAccessTokensImmediately() throws Exception {
        String access = loginAccessToken();
        authService.logoutAll(customer.getEmail());
        assertAccessRejected(access);
    }

    @Test
    void roleChangeInvalidatesOldAccessTokensImmediately() throws Exception {
        String access = loginAccessToken();
        adminUserService.changeRole(customer.getId(),
                new ChangeUserRoleRequest(RoleName.POS_STAFF, customer.getVersion()), operator.getEmail());
        assertAccessRejected(access);
    }

    @Test
    void disabledAccountAccessDoesNotReviveAfterReactivation() throws Exception {
        String access = loginAccessToken();
        var disabled = adminUserService.disableUser(customer.getId(), customer.getVersion(), operator.getEmail());
        adminUserService.reactivateUser(customer.getId(), disabled.version(), operator.getEmail());
        assertAccessRejected(access);
    }

    @Test
    void contactEditsPreserveTheCurrentAccessSession() throws Exception {
        String access = loginAccessToken();
        adminUserService.updateUser(customer.getId(),
                new UpdateUserRequest("Updated contact", null, null, customer.getVersion()), operator.getEmail());
        mockMvc.perform(get("/api/v1/auth/me").header("Authorization", "Bearer " + access))
                .andExpect(status().isOk());
    }

    private String loginAccessToken() throws Exception {
        String access = authService.login(new LoginRequest(customer.getEmail(), "Password123!")).authResponse().accessToken();
        mockMvc.perform(get("/api/v1/auth/me").header("Authorization", "Bearer " + access))
                .andExpect(status().isOk());
        return access;
    }

    private void assertAccessRejected(String access) throws Exception {
        mockMvc.perform(get("/api/v1/auth/me").header("Authorization", "Bearer " + access))
                .andExpect(status().isUnauthorized());
    }

    private String createResetToken() {
        String raw = TokenHashUtil.generateSecureRandomToken();
        passwordResetTokenRepository.saveAndFlush(PasswordResetToken.builder().user(customer)
                .tokenHash(TokenHashUtil.hashToken(raw)).expiresAt(Instant.now().plusSeconds(600)).build());
        return raw;
    }

    private void assertRotationRevokedBy(Runnable revocation) throws Exception {
        String original = refreshTokenService.createRefreshToken(customer, "test", "127.0.0.1").rawRefreshToken();
        CountDownLatch rotated = new CountDownLatch(1);
        CountDownLatch allowCommit = new CountDownLatch(1);
        AtomicInteger revocationPid = new AtomicInteger();
        TransactionTemplate transaction = new TransactionTemplate(transactionManager);
        try (var executor = Executors.newFixedThreadPool(2)) {
            Future<?> refresh = executor.submit(() -> transaction.executeWithoutResult(status -> {
                authService.refresh(original, "test", "127.0.0.1");
                rotated.countDown();
                await(allowCommit);
            }));
            try {
                assertThat(rotated.await(10, TimeUnit.SECONDS)).isTrue();
                Future<?> revoke = executor.submit(() -> transaction.executeWithoutResult(status -> {
                    revocationPid.set(jdbcTemplate.queryForObject("SELECT pg_backend_pid()", Integer.class));
                    revocation.run();
                }));
                waitUntilBlockedOrDone(revocationPid, revoke);
                assertThat(revoke.isDone()).as("Revocation must wait for the in-flight rotation").isFalse();
                allowCommit.countDown();
                refresh.get(15, TimeUnit.SECONDS);
                revoke.get(15, TimeUnit.SECONDS);
                assertThat(refreshTokenRepository.findAllByUserIdAndRevokedAtIsNull(customer.getId())).isEmpty();
            } finally {
                allowCommit.countDown();
            }
        }
    }

    private void waitUntilBlockedOrDone(AtomicInteger pid, Future<?> task) throws Exception {
        long deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(10);
        while (System.nanoTime() < deadline) {
            if (task.isDone()) return;
            if (pid.get() != 0 && Boolean.TRUE.equals(jdbcTemplate.queryForObject(
                    "SELECT EXISTS (SELECT 1 FROM pg_stat_activity WHERE pid = ? AND wait_event_type = 'Lock')",
                    Boolean.class, pid.get()))) return;
            Thread.sleep(20);
        }
        throw new IllegalStateException("Concurrent authentication request did not reach its database lock.");
    }

    private void await(CountDownLatch latch) {
        try {
            if (!latch.await(15, TimeUnit.SECONDS)) throw new IllegalStateException("Timed out waiting to commit authentication transaction.");
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Authentication test interrupted.", ex);
        }
    }

    private List<Boolean> runTwice(Runnable operation) throws Exception {
        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);
        Callable<Boolean> task = () -> {
            ready.countDown();
            if (!start.await(10, TimeUnit.SECONDS)) {
                throw new IllegalStateException("Timed out waiting for concurrent authentication request.");
            }
            try {
                operation.run();
                return true;
            } catch (BadCredentialsException ex) {
                return false;
            }
        };
        try (var executor = Executors.newFixedThreadPool(2)) {
            var first = executor.submit(task);
            var second = executor.submit(task);
            assertThat(ready.await(10, TimeUnit.SECONDS)).isTrue();
            start.countDown();
            return List.of(first.get(20, TimeUnit.SECONDS), second.get(20, TimeUnit.SECONDS));
        }
    }
}
