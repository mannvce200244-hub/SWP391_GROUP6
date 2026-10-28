package com.m4n.backend.service;

import com.m4n.backend.dto.request.*;
import com.m4n.backend.exception.InvalidEmailOtpException;
import com.m4n.backend.repository.*;
import com.m4n.backend.util.TokenHashUtil;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.mockito.ArgumentCaptor;
import java.time.Instant;
import java.util.UUID;
import java.util.concurrent.*;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@SpringBootTest
class EmailOtpIntegrationTest {
    @Autowired EmailOtpService service;
    @Autowired EmailOtpChallengeRepository challenges;
    @Autowired UserRepository users;
    @Autowired AuthService auth;
    @MockitoBean EmailOtpNotifier notifier;

    @BeforeEach void setUp() { when(notifier.isAvailable()).thenReturn(true); }

    @Test void failedAttemptsCommitAndBlockCorrectCodeAfterFiveGuesses() {
        String email = email();
        var response = service.requestCode(new EmailOtpRequest(email, "REGISTER"));
        String code = code(email, "REGISTER");
        var registration = new RegisterRequest("OTP fixture", email, "Password123!", null);
        String wrong = code.equals("000000") ? "111111" : "000000";
        for (int i = 0; i < 5; i++) {
            assertThatThrownBy(() -> service.register(new VerifiedRegisterRequest(registration, response.challengeId(), wrong)))
                    .isInstanceOf(InvalidEmailOtpException.class);
        }
        assertThat(challenges.findById(key(email, "REGISTER")).orElseThrow().getAttempts()).isEqualTo(5);
        assertThatThrownBy(() -> service.register(new VerifiedRegisterRequest(registration, response.challengeId(), code)))
                .isInstanceOf(InvalidEmailOtpException.class);
        assertThat(users.existsByEmailIgnoreCase(email)).isFalse();
    }

    @Test void resendingInvalidatesPreviousChallengeAndExpiredCodeIsRejected() {
        String email = email();
        var old = service.requestCode(new EmailOtpRequest(email, "REGISTER"));
        String oldCode = code(email, "REGISTER");
        assertThatThrownBy(() -> service.requestCode(new EmailOtpRequest(email, "REGISTER")))
                .hasMessageContaining("60");
        var row = challenges.findById(key(email, "REGISTER")).orElseThrow();
        row.setSentAt(Instant.now().minusSeconds(61));
        challenges.save(row);
        var next = service.requestCode(new EmailOtpRequest(email, "REGISTER"));
        var registration = new RegisterRequest("OTP fixture", email, "Password123!", null);
        assertThatThrownBy(() -> service.register(new VerifiedRegisterRequest(registration, old.challengeId(), oldCode)))
                .isInstanceOf(InvalidEmailOtpException.class);
        row = challenges.findById(key(email, "REGISTER")).orElseThrow();
        row.setExpiresAt(Instant.now().minusSeconds(1));
        challenges.save(row);
        String latestCode = code(email, "REGISTER");
        assertThatThrownBy(() -> service.register(new VerifiedRegisterRequest(registration, next.challengeId(), latestCode)))
                .isInstanceOf(InvalidEmailOtpException.class);
    }

    @Test void concurrentRegistrationConsumesOtpOnlyOnce() throws Exception {
        String email = email();
        var response = service.requestCode(new EmailOtpRequest(email, "REGISTER"));
        var request = new VerifiedRegisterRequest(new RegisterRequest("OTP fixture", email, "Password123!", null),
                response.challengeId(), code(email, "REGISTER"));
        var gate = new CountDownLatch(1);
        try (var pool = Executors.newFixedThreadPool(2)) {
            Callable<Boolean> call = () -> { gate.await(); try { service.register(request); return true; }
                catch (InvalidEmailOtpException ex) { return false; } };
            var first = pool.submit(call);
            var second = pool.submit(call);
            gate.countDown();
            assertThat(first.get(10, TimeUnit.SECONDS) ^ second.get(10, TimeUnit.SECONDS)).isTrue();
        }
        assertThat(challenges.findById(key(email, "REGISTER")).orElseThrow().isConsumed()).isTrue();
    }

    @Test void resendRejectsOldCodeEvenWithNewChallengeAndAcceptsNewestOnlyOnce() {
        String email = email();
        var previous = service.requestCode(new EmailOtpRequest(email, "REGISTER"));
        String previousCode = code(email, "REGISTER");
        allowResend(email, "REGISTER");
        var latest = service.requestCode(new EmailOtpRequest(email, "REGISTER"));
        String latestCode = code(email, "REGISTER");
        assertThat(latest.challengeId()).isNotEqualTo(previous.challengeId());
        assertThat(latestCode).isNotEqualTo(previousCode);
        var registration = new RegisterRequest("OTP fixture", email, "Password123!", null);
        assertThatThrownBy(() -> service.register(new VerifiedRegisterRequest(registration, previous.challengeId(), latestCode)))
                .isInstanceOf(InvalidEmailOtpException.class);
        assertThatThrownBy(() -> service.register(new VerifiedRegisterRequest(registration, latest.challengeId(), previousCode)))
                .isInstanceOf(InvalidEmailOtpException.class);
        var valid = new VerifiedRegisterRequest(registration, latest.challengeId(), latestCode);
        service.register(valid);
        assertThat(users.existsByEmailIgnoreCase(email)).isTrue();
        assertThatThrownBy(() -> service.register(valid)).isInstanceOf(InvalidEmailOtpException.class);
    }

    @Test void failedRegistrationResendKeepsPreviouslyDeliveredCodeValid() {
        String email = email();
        var previous = service.requestCode(new EmailOtpRequest(email, "REGISTER"));
        String previousCode = code(email, "REGISTER");
        allowResend(email, "REGISTER");
        doThrow(new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE))
                .when(notifier).sendCode(eq(email), anyString(), eq("REGISTER"));
        assertThatThrownBy(() -> service.requestCode(new EmailOtpRequest(email, "REGISTER")))
                .isInstanceOf(org.springframework.web.server.ResponseStatusException.class);
        service.register(new VerifiedRegisterRequest(new RegisterRequest("OTP fixture", email, "Password123!", null),
                previous.challengeId(), previousCode));
        assertThat(users.existsByEmailIgnoreCase(email)).isTrue();
    }

    @Test void resetResendRejectsOldCodeAndAcceptsNewest() {
        String email = email();
        auth.register(new RegisterRequest("OTP fixture", email, "Password123!", null));
        var previous = service.requestCode(new EmailOtpRequest(email, "RESET_PASSWORD"));
        String previousCode = code(email, "RESET_PASSWORD");
        allowResend(email, "RESET_PASSWORD");
        var latest = service.requestCode(new EmailOtpRequest(email, "RESET_PASSWORD"));
        String latestCode = code(email, "RESET_PASSWORD");
        assertThatThrownBy(() -> service.resetPassword(new OtpResetPasswordRequest(email, previous.challengeId(), previousCode,
                "NewPassword123!", "NewPassword123!"))).isInstanceOf(InvalidEmailOtpException.class);
        assertThatThrownBy(() -> service.resetPassword(new OtpResetPasswordRequest(email, latest.challengeId(), previousCode,
                "NewPassword123!", "NewPassword123!"))).isInstanceOf(InvalidEmailOtpException.class);
        service.resetPassword(new OtpResetPasswordRequest(email, latest.challengeId(), latestCode,
                "NewPassword123!", "NewPassword123!"));
        assertThat(auth.login(new LoginRequest(email, "NewPassword123!"))).isNotNull();
    }

    private void allowResend(String email, String purpose) {
        var row = challenges.findById(key(email, purpose)).orElseThrow();
        row.setSentAt(Instant.now().minusSeconds(61));
        challenges.save(row);
    }

    @Test void resetOtpIsPurposeBoundSingleUseAndRevokesSessionGeneration() {
        String email = email();
        auth.register(new RegisterRequest("OTP fixture", email, "Password123!", null));
        long before = users.findByEmailIgnoreCase(email).orElseThrow().getSessionVersion();
        var response = service.requestCode(new EmailOtpRequest(email, "RESET_PASSWORD"));
        String code = code(email, "RESET_PASSWORD");
        assertThatThrownBy(() -> service.register(new VerifiedRegisterRequest(
                new RegisterRequest("OTP fixture", email, "Password123!", null), response.challengeId(), code)))
                .isInstanceOf(InvalidEmailOtpException.class);
        var reset = new OtpResetPasswordRequest(email, response.challengeId(), code, "NewPassword123!", "NewPassword123!");
        service.resetPassword(reset);
        assertThat(users.findByEmailIgnoreCase(email).orElseThrow().getSessionVersion()).isGreaterThan(before);
        assertThatThrownBy(() -> service.resetPassword(reset)).isInstanceOf(InvalidEmailOtpException.class);
        assertThat(auth.login(new LoginRequest(email, "NewPassword123!"))).isNotNull();
    }

    @Test void unavailableEmailDoesNotIssueAnyChallenge() {
        when(notifier.isAvailable()).thenReturn(false);
        String email = email();
        assertThatThrownBy(() -> service.requestCode(new EmailOtpRequest(email, "REGISTER"))).hasMessageContaining("503");
        assertThat(challenges.findById(key(email, "REGISTER"))).isEmpty();
    }

    private String code(String email, String purpose) {
        var captured = ArgumentCaptor.forClass(String.class);
        verify(notifier, atLeastOnce()).sendCode(eq(email), captured.capture(), eq(purpose));
        return captured.getValue();
    }
    private String email() { return "otp-" + UUID.randomUUID() + "@example.test"; }
    private String key(String email, String purpose) { return TokenHashUtil.hashToken(purpose + ":" + email); }
}
