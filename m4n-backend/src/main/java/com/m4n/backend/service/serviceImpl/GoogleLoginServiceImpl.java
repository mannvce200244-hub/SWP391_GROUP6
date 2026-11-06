package com.m4n.backend.service.serviceImpl;

import com.m4n.backend.entity.RoleName;
import com.m4n.backend.entity.User;
import com.m4n.backend.repository.RoleRepository;
import com.m4n.backend.repository.UserRepository;
import com.m4n.backend.service.GoogleLoginService;
import com.m4n.backend.service.RefreshTokenService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GoogleLoginServiceImpl implements GoogleLoginService {
    private final UserRepository users;
    private final RoleRepository roles;
    private final PasswordEncoder passwords;
    private final RefreshTokenService refreshTokens;

    @Override
    @Transactional
    public String signIn(Identity identity, String userAgent, String ipAddress) {
        if (!identity.emailVerified() || identity.subject() == null || identity.subject().isBlank()
                || identity.subject().length() > 255 || identity.email() == null
                || identity.email().length() > 255 || !identity.email().matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
            throw new BadCredentialsException("Google identity is not verified.");
        }
        String email = identity.email().trim().toLowerCase(Locale.ROOT);
        User user = users.findByGoogleSubject(identity.subject()).orElse(null);
        if (user == null) {
            user = users.findByEmailIgnoreCaseWithLock(email).orElse(null);
            if (user == null) {
                String name = identity.fullName() == null || identity.fullName().isBlank() ? email : identity.fullName().trim();
                user = User.builder().email(email).password(unusablePassword())
                        .fullName(name.substring(0, Math.min(name.length(), 150)))
                        .role(roles.findByName(RoleName.CUSTOMER).orElseThrow())
                        .emailVerified(true).isActive(true).build();
            } else {
                requireCustomer(user);
                // Google is not authoritative for third-party email addresses without a hosted domain.
                String domain = email.substring(email.lastIndexOf('@') + 1);
                if (!(domain.equals("gmail.com") || domain.equalsIgnoreCase(identity.hostedDomain()))) {
                    throw new BadCredentialsException("Use password login for this email address.");
                }
                if (user.getGoogleSubject() != null && !user.getGoogleSubject().equals(identity.subject())) {
                    throw new BadCredentialsException("Google identity does not match.");
                }
                if (!user.isEmailVerified()) {
                    // An unverified signup may have been started by somebody who does not own the email.
                    user.setPassword(unusablePassword());
                    user.setSessionVersion(user.getSessionVersion() + 1);
                }
                user.setEmailVerified(true);
            }
            user.setGoogleSubject(identity.subject());
            user = users.saveAndFlush(user);
        }
        requireCustomer(user);
        if (!user.isEmailVerified()) throw new BadCredentialsException("Email verification required.");
        return refreshTokens.createRefreshToken(user, userAgent, ipAddress).rawRefreshToken();
    }

    private void requireCustomer(User user) {
        if (!user.isActive()) throw new DisabledException("Account is inactive.");
        if (user.getRole().getName() != RoleName.CUSTOMER) {
            throw new BadCredentialsException("Staff accounts require password login.");
        }
    }

    private String unusablePassword() {
        return passwords.encode(UUID.randomUUID().toString() + UUID.randomUUID());
    }
}
