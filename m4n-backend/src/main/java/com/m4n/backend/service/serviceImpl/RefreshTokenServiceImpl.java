package com.m4n.backend.service.serviceImpl;

import com.m4n.backend.entity.RefreshToken;
import com.m4n.backend.entity.User;
import com.m4n.backend.repository.RefreshTokenRepository;
import com.m4n.backend.repository.UserRepository;
import com.m4n.backend.service.RefreshTokenService;
import com.m4n.backend.util.TokenHashUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;

@Slf4j
@Service
public class RefreshTokenServiceImpl implements RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final UserRepository userRepository;

    @Value("${m4n.jwt.refresh-expiration-days:7}")
    private long refreshExpirationDays;

    public RefreshTokenServiceImpl(RefreshTokenRepository refreshTokenRepository, UserRepository userRepository) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public TokenPair createRefreshToken(User user, String userAgent, String ipAddress) {
        user = lockUser(user.getId());
        if (!user.isActive() || !user.isEmailVerified()) {
            throw new DisabledException("Account is inactive or email is unverified.");
        }
        String rawToken = TokenHashUtil.generateSecureRandomToken();
        String tokenHash = TokenHashUtil.hashToken(rawToken);

        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .tokenHash(tokenHash)
                .expiresAt(Instant.now().plus(Duration.ofDays(refreshExpirationDays)))
                .userAgent(sanitizeMetadata(userAgent, 500))
                .ipAddress(sanitizeMetadata(ipAddress, 100))
                .build();

        refreshTokenRepository.save(refreshToken);
        log.info("Created refresh token session for user: {}", user.getEmail());
        return new TokenPair(user, rawToken);
    }

    @Override
    @Transactional(noRollbackFor = BadCredentialsException.class)
    public TokenPair rotateRefreshToken(String rawRefreshToken, String userAgent, String ipAddress) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            throw new BadCredentialsException("Refresh token is required.");
        }

        String tokenHash = TokenHashUtil.hashToken(rawRefreshToken);
        Long userId = refreshTokenRepository.findUserIdByTokenHash(tokenHash)
                .orElseThrow(() -> new BadCredentialsException("Invalid or expired refresh token."));
        User user = lockUser(userId);
        RefreshToken token = refreshTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new BadCredentialsException("Invalid or expired refresh token."));

        if (token.isRevoked()) {
            log.warn("CRITICAL: Refresh token reuse detected for user ID {}! Revoking all sessions.", token.getUser().getId());
            revokeAllUserSessions(token.getUser().getId());
            throw new BadCredentialsException("Refresh token reuse detected. All sessions have been revoked.");
        }

        if (token.isExpired()) {
            log.info("Attempted refresh with expired token for user: {}", token.getUser().getEmail());
            throw new BadCredentialsException("Refresh token has expired.");
        }

        if (!user.isActive() || !user.isEmailVerified()) {
            log.warn("Attempted refresh with inactive user: {}", user.getEmail());
            throw new DisabledException("Account is inactive or email is unverified.");
        }

        // Generate new rotated token
        String newRawToken = TokenHashUtil.generateSecureRandomToken();
        String newTokenHash = TokenHashUtil.hashToken(newRawToken);

        RefreshToken newToken = RefreshToken.builder()
                .user(user)
                .tokenHash(newTokenHash)
                .expiresAt(Instant.now().plus(Duration.ofDays(refreshExpirationDays)))
                .userAgent(sanitizeMetadata(userAgent, 500))
                .ipAddress(sanitizeMetadata(ipAddress, 100))
                .build();

        RefreshToken savedNewToken = refreshTokenRepository.save(newToken);

        // Mark current token as revoked and rotated
        token.setRevokedAt(Instant.now());
        token.setLastUsedAt(Instant.now());
        token.setReplacedByTokenId(savedNewToken.getId());
        refreshTokenRepository.save(token);

        log.info("Successfully rotated refresh token for user: {}", user.getEmail());
        return new TokenPair(user, newRawToken);
    }

    @Override
    @Transactional
    public void revokeRefreshToken(String rawRefreshToken) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            return;
        }
        String tokenHash = TokenHashUtil.hashToken(rawRefreshToken);
        var userId = refreshTokenRepository.findUserIdByTokenHash(tokenHash);
        if (userId.isEmpty()) {
            return;
        }
        lockUser(userId.get());
        refreshTokenRepository.findByTokenHash(tokenHash).ifPresent(token -> {
            if (!token.isRevoked()) {
                token.setRevokedAt(Instant.now());
                token.setLastUsedAt(Instant.now());
                refreshTokenRepository.save(token);
                log.info("Revoked refresh token session for user ID: {}", token.getUser().getId());
            }
        });
    }

    @Override
    @Transactional
    public void revokeAllUserSessions(Long userId) {
        if (userId != null) {
            User user = lockUser(userId);
            user.setSessionVersion(user.getSessionVersion() + 1);
            int revokedCount = refreshTokenRepository.revokeAllByUserId(userId, Instant.now());
            log.info("Revoked all active sessions ({}) for user ID: {}", revokedCount, userId);
        }
    }

    @Override
    @Transactional
    public void cleanupExpiredTokens() {
        // Retain revoked/expired tokens for 30 days before hard delete
        Instant cutoff = Instant.now().minus(Duration.ofDays(30));
        int deleted = refreshTokenRepository.deleteExpiredBefore(cutoff);
        log.info("Cleaned up {} expired refresh token records older than {}", deleted, cutoff);
    }

    private String sanitizeMetadata(String value, int maxLength) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.length() > maxLength ? trimmed.substring(0, maxLength) : trimmed;
    }

    private User lockUser(Long userId) {
        // Always lock the account before its tokens, including bulk revocation.
        // A rotated replacement cannot commit after a concurrent session revocation.
        return userRepository.findByIdWithLock(userId)
                .orElseThrow(() -> new BadCredentialsException("Account is unavailable."));
    }
}
