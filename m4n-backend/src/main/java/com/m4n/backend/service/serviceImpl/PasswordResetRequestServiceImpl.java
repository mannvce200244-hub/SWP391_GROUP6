package com.m4n.backend.service.serviceImpl;

import com.m4n.backend.entity.PasswordResetToken;
import com.m4n.backend.repository.PasswordResetTokenRepository;
import com.m4n.backend.repository.UserRepository;
import com.m4n.backend.service.PasswordResetNotifier;
import com.m4n.backend.service.PasswordResetRequestService;
import com.m4n.backend.util.TokenHashUtil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
public class PasswordResetRequestServiceImpl implements PasswordResetRequestService {
    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final PasswordResetNotifier notifier;
    private final long expirationMinutes;

    public PasswordResetRequestServiceImpl(UserRepository userRepository,
            PasswordResetTokenRepository tokenRepository, PasswordResetNotifier notifier,
            @Value("${m4n.auth.password-reset-expiration-minutes:15}") long expirationMinutes) {
        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
        this.notifier = notifier;
        this.expirationMinutes = expirationMinutes;
    }

    @Override
    @Transactional
    public void requestReset(String normalizedEmail) {
        userRepository.findByEmailIgnoreCaseWithLock(normalizedEmail).filter(user -> user.isActive()).ifPresent(user -> {
            tokenRepository.invalidateAllByUserId(user.getId(), Instant.now());
            String raw = TokenHashUtil.generateSecureRandomToken(32);
            tokenRepository.saveAndFlush(PasswordResetToken.builder().user(user)
                    .tokenHash(TokenHashUtil.hashToken(raw))
                    .expiresAt(Instant.now().plusSeconds(expirationMinutes * 60)).build());
            // A failed provider request rolls back both the new token and prior-token invalidation.
            notifier.sendPasswordResetNotification(user.getEmail(), raw);
        });
    }
}
