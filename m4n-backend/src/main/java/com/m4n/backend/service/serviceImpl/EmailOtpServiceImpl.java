package com.m4n.backend.service.serviceImpl;

import com.m4n.backend.dto.request.*;
import com.m4n.backend.dto.response.*;
import com.m4n.backend.entity.EmailOtpChallenge;
import com.m4n.backend.entity.PasswordResetToken;
import com.m4n.backend.entity.User;
import com.m4n.backend.exception.InvalidEmailOtpException;
import com.m4n.backend.repository.*;
import com.m4n.backend.service.*;
import com.m4n.backend.util.TokenHashUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EmailOtpServiceImpl implements EmailOtpService {
    private static final SecureRandom RANDOM = new SecureRandom();
    private final EmailOtpChallengeRepository challenges;
    private final EmailOtpNotifier notifier;
    private final PasswordEncoder encoder;
    private final AuthService auth;
    private final UserRepository users;
    private final PasswordResetTokenRepository resetTokens;
    private final RefreshTokenService sessions;

    @Override
    @Transactional
    public EmailOtpResponse startRegistration(RegisterRequest request) {
        auth.registerUnverified(request);
        return requestCode(new EmailOtpRequest(request.email(), "REGISTER"));
    }

    @Override
    @Transactional(noRollbackFor = InvalidEmailOtpException.class)
    public UserResponse verifyRegistration(VerifyRegistrationRequest request) {
        EmailOtpChallenge challenge = verify(request.email(), "REGISTER", request.challengeId(), request.code());
        challenge.setConsumed(true);
        return auth.completePendingRegistration(normalize(request.email()), request.challengeId());
    }

    @Override
    @Transactional
    public EmailOtpResponse requestCode(EmailOtpRequest request) {
        if (!notifier.isAvailable()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Dịch vụ OTP email chưa được cấu hình. Vui lòng liên hệ bộ phận hỗ trợ.");
        }
        if (!request.purpose().equals("REGISTER") && !request.purpose().equals("RESET_PASSWORD")) {
            throw new IllegalArgumentException("Mục đích xác thực không hợp lệ.");
        }
        String email = normalize(request.email());
        String id = key(email, request.purpose());
        challenges.ensureExists(id, email, request.purpose());
        EmailOtpChallenge challenge = challenges.findLocked(id).orElseThrow();
        Instant now = Instant.now();
        if (challenge.getSentAt() != null && now.isBefore(challenge.getSentAt().plusSeconds(60))) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Vui lòng chờ 60 giây giữa các lần gửi mã.");
        }
        if (challenge.getWindowStartedAt() == null || !now.isBefore(challenge.getWindowStartedAt().plusSeconds(3600))) {
            challenge.setWindowStartedAt(now);
            challenge.setSends(0);
        }
        if (challenge.getSends() >= 10) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Đã vượt số lần gửi mã. Vui lòng thử lại sau một giờ.");
        }
        String code;
        do {
            code = String.format(Locale.ROOT, "%06d", RANDOM.nextInt(1_000_000));
        } while (challenge.getCodeHash() != null && encoder.matches(code, challenge.getCodeHash()));
        challenge.setChallengeId(UUID.randomUUID().toString());
        challenge.setCodeHash(encoder.encode(code));
        challenge.setAttempts(0);
        challenge.setConsumed(false);
        challenge.setExpiresAt(now.plusSeconds(600));
        challenge.setSentAt(now);
        challenge.setSends(challenge.getSends() + 1);
        boolean reset = request.purpose().equals("RESET_PASSWORD");
        var resetUser = reset ? users.findByEmailIgnoreCaseWithLock(email).filter(u -> u.isActive())
                : Optional.<User>empty();
        // Resending also revokes a reset credential issued by an earlier verified OTP.
        resetUser.ifPresent(user -> resetTokens.invalidateAllByUserId(user.getId(), now));
        boolean eligible = !reset || resetUser.isPresent();
        if (eligible) {
            try {
                notifier.sendCode(email, code, request.purpose());
            } catch (ResponseStatusException ex) {
                if (!reset) throw ex;
                // Same response for all reset accounts, including delivery failure.
                challenge.setConsumed(true);
            }
        }
        challenges.save(challenge);
        return new EmailOtpResponse(challenge.getChallengeId(), challenge.getExpiresAt(), now.plusSeconds(60),
                reset ? "Nếu tài khoản hợp lệ và email được gửi thành công, bạn sẽ nhận mã OTP. Hãy kiểm tra thư rác."
                        : "Email xác thực đã được gửi. Hãy kiểm tra hộp thư và thư rác.");
    }

    @Override
    @Transactional(noRollbackFor = InvalidEmailOtpException.class)
    public UserResponse register(VerifiedRegisterRequest request) {
        EmailOtpChallenge challenge = verify(request.registration().email(), "REGISTER", request.challengeId(), request.code());
        UserResponse response = auth.register(request.registration());
        challenge.setConsumed(true);
        return response;
    }

    @Override
    @Transactional(noRollbackFor = InvalidEmailOtpException.class)
    public VerifiedResetOtpResponse verifyResetOtp(VerifyResetOtpRequest request) {
        EmailOtpChallenge challenge = verify(request.email(), "RESET_PASSWORD", request.challengeId(), request.code());
        var user = users.findByEmailIgnoreCaseWithLock(normalize(request.email()))
                .filter(u -> u.isActive()).orElseThrow(InvalidEmailOtpException::new);
        String token = TokenHashUtil.generateSecureRandomToken(32);
        resetTokens.invalidateAllByUserId(user.getId(), Instant.now());
        resetTokens.save(PasswordResetToken.builder().user(user).tokenHash(TokenHashUtil.hashToken(token))
                .expiresAt(challenge.getExpiresAt()).build());
        challenge.setConsumed(true);
        return new VerifiedResetOtpResponse(token, challenge.getExpiresAt());
    }

    @Override
    @Transactional(noRollbackFor = InvalidEmailOtpException.class)
    public void resetPassword(OtpResetPasswordRequest request) {
        if (!request.newPassword().equals(request.confirmPassword())
                || request.newPassword().getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new IllegalArgumentException("Mật khẩu xác nhận phải khớp và mật khẩu tối đa 72 byte UTF-8.");
        }
        EmailOtpChallenge challenge = verify(request.email(), "RESET_PASSWORD", request.challengeId(), request.code());
        var user = users.findByEmailIgnoreCaseWithLock(normalize(request.email()))
                .filter(u -> u.isActive()).orElseThrow(InvalidEmailOtpException::new);
        user.setPassword(encoder.encode(request.newPassword()));
        resetTokens.invalidateAllByUserId(user.getId(), Instant.now());
        sessions.revokeAllUserSessions(user.getId());
        challenge.setConsumed(true);
    }

    private EmailOtpChallenge verify(String email, String purpose, String challengeId, String code) {
        EmailOtpChallenge challenge = challenges.findLocked(key(normalize(email), purpose))
                .orElseThrow(InvalidEmailOtpException::new);
        if (challenge.isConsumed() || challenge.getAttempts() >= 5 || challenge.getExpiresAt() == null
                || !Instant.now().isBefore(challenge.getExpiresAt()) || !challengeId.equals(challenge.getChallengeId())) {
            throw new InvalidEmailOtpException();
        }
        challenge.setAttempts(challenge.getAttempts() + 1);
        if (!encoder.matches(code, challenge.getCodeHash())) throw new InvalidEmailOtpException();
        return challenge;
    }

    private String normalize(String email) { return email.trim().toLowerCase(Locale.ROOT); }
    private String key(String email, String purpose) { return TokenHashUtil.hashToken(purpose + ":" + email); }
}
