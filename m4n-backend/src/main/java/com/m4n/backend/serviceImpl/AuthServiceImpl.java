package com.m4n.backend.serviceImpl;

import com.m4n.backend.dto.request.ChangePasswordRequest;
import com.m4n.backend.dto.request.ForgotPasswordRequest;
import com.m4n.backend.dto.request.LoginRequest;
import com.m4n.backend.dto.request.RegisterRequest;
import com.m4n.backend.dto.request.ResetPasswordRequest;
import com.m4n.backend.dto.response.AuthResponse;
import com.m4n.backend.dto.response.UserResponse;
import com.m4n.backend.entity.PasswordResetToken;
import com.m4n.backend.entity.Role;
import com.m4n.backend.entity.RoleName;
import com.m4n.backend.entity.User;
import com.m4n.backend.exception.DuplicateResourceException;
import com.m4n.backend.exception.ResourceNotFoundException;
import com.m4n.backend.mapper.UserMapper;
import com.m4n.backend.repository.PasswordResetTokenRepository;
import com.m4n.backend.repository.RoleRepository;
import com.m4n.backend.repository.UserRepository;
import com.m4n.backend.security.JwtService;
import com.m4n.backend.service.AuthService;
import com.m4n.backend.service.PasswordResetNotifier;
import com.m4n.backend.service.RefreshTokenService;
import com.m4n.backend.util.TokenHashUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;

@Slf4j
@Service
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final UserMapper userMapper;
    private final RefreshTokenService refreshTokenService;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordResetNotifier passwordResetNotifier;

    @Value("${m4n.auth.password-reset-expiration-minutes:15}")
    private long passwordResetExpirationMinutes;

    public AuthServiceImpl(
            UserRepository userRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            AuthenticationManager authenticationManager,
            UserMapper userMapper,
            RefreshTokenService refreshTokenService,
            PasswordResetTokenRepository passwordResetTokenRepository,
            PasswordResetNotifier passwordResetNotifier
    ) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
        this.userMapper = userMapper;
        this.refreshTokenService = refreshTokenService;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.passwordResetNotifier = passwordResetNotifier;
    }

    @Override
    @Transactional
    public UserResponse register(RegisterRequest request) {
        String normalizedEmail = request.email().trim().toLowerCase();

        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new DuplicateResourceException("Email is already registered: " + normalizedEmail);
        }

        Role customerRole = roleRepository.findByName(RoleName.CUSTOMER)
                .orElseGet(() -> roleRepository.save(
                        Role.builder()
                                .name(RoleName.CUSTOMER)
                                .description("Customer role for purchasing instruments")
                                .build()
                ));

        User user = User.builder()
                .email(normalizedEmail)
                .password(passwordEncoder.encode(request.password()))
                .fullName(request.fullName().trim())
                .phone(request.phone() != null ? request.phone().trim() : null)
                .address(request.address() != null ? request.address().trim() : null)
                .isActive(true)
                .role(customerRole)
                .build();

        User savedUser = userRepository.save(user);
        log.info("Registered new Customer account: {}", normalizedEmail);
        return userMapper.toResponse(savedUser);
    }

    @Override
    @Transactional
    public LoginResult login(LoginRequest request, String userAgent, String ipAddress) {
        String normalizedEmail = request.email().trim().toLowerCase();

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(normalizedEmail, request.password())
        );

        User user = userRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + normalizedEmail));

        if (!user.isActive()) {
            throw new DisabledException("Account is inactive.");
        }

        String accessToken = jwtService.generateToken(user.getId(), user.getEmail(), user.getRole().getName());
        RefreshTokenService.TokenPair tokenPair = refreshTokenService.createRefreshToken(user, userAgent, ipAddress);

        AuthResponse authResponse = new AuthResponse(
                accessToken,
                jwtService.getExpirationSeconds(),
                userMapper.toResponse(user)
        );

        log.info("Login successful for user: {} ({})", user.getEmail(), user.getRole().getName());
        return new LoginResult(authResponse, tokenPair.rawRefreshToken());
    }

    @Override
    @Transactional
    public LoginResult refresh(String rawRefreshToken, String userAgent, String ipAddress) {
        RefreshTokenService.TokenPair tokenPair = refreshTokenService.rotateRefreshToken(rawRefreshToken, userAgent, ipAddress);
        User user = tokenPair.user();

        String newAccessToken = jwtService.generateToken(user.getId(), user.getEmail(), user.getRole().getName());

        AuthResponse authResponse = new AuthResponse(
                newAccessToken,
                jwtService.getExpirationSeconds(),
                userMapper.toResponse(user)
        );

        log.info("Token refresh successful for user: {}", user.getEmail());
        return new LoginResult(authResponse, tokenPair.rawRefreshToken());
    }

    @Override
    @Transactional
    public void logout(String rawRefreshToken) {
        refreshTokenService.revokeRefreshToken(rawRefreshToken);
    }

    @Override
    @Transactional
    public void logoutAll(String currentUserEmail) {
        String normalizedEmail = currentUserEmail.trim().toLowerCase();
        User user = userRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + normalizedEmail));

        refreshTokenService.revokeAllUserSessions(user.getId());
        log.info("User {} logged out from all active sessions", normalizedEmail);
    }

    @Override
    @Transactional
    public void changePassword(String currentUserEmail, ChangePasswordRequest request) {
        String normalizedEmail = currentUserEmail.trim().toLowerCase();
        User user = userRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + normalizedEmail));

        if (!passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
            throw new BadCredentialsException("Mật khẩu hiện tại không chính xác.");
        }

        if (!request.newPassword().equals(request.confirmPassword())) {
            throw new IllegalArgumentException("Mật khẩu mới và xác nhận mật khẩu không khớp.");
        }

        if (passwordEncoder.matches(request.newPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Mật khẩu mới không được trùng với mật khẩu hiện tại.");
        }

        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);

        // Security requirement: Revoke all active sessions upon password change
        refreshTokenService.revokeAllUserSessions(user.getId());
        log.info("Password changed and all active sessions revoked for user: {}", normalizedEmail);
    }

    @Override
    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        String normalizedEmail = request.email().trim().toLowerCase();
        Optional<User> userOpt = userRepository.findByEmailIgnoreCase(normalizedEmail);

        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (user.isActive()) {
                // Invalidate any previous unused reset tokens for this user
                passwordResetTokenRepository.invalidateAllByUserId(user.getId(), Instant.now());

                String rawToken = TokenHashUtil.generateSecureRandomToken(32);
                String tokenHash = TokenHashUtil.hashToken(rawToken);

                PasswordResetToken resetToken = PasswordResetToken.builder()
                        .user(user)
                        .tokenHash(tokenHash)
                        .expiresAt(Instant.now().plus(Duration.ofMinutes(passwordResetExpirationMinutes)))
                        .build();

                passwordResetTokenRepository.save(resetToken);
                passwordResetNotifier.sendPasswordResetNotification(user.getEmail(), rawToken);
                log.info("Password reset token generated and notification dispatched for email: {}", normalizedEmail);
            } else {
                log.warn("Forgot password requested for inactive account: {}", normalizedEmail);
            }
        } else {
            log.info("Forgot password requested for non-existent email: {}", normalizedEmail);
        }
        // Always return silently with constant generic response to prevent account enumeration
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        if (!request.newPassword().equals(request.confirmPassword())) {
            throw new IllegalArgumentException("Mật khẩu mới và xác nhận mật khẩu không khớp.");
        }

        String tokenHash = TokenHashUtil.hashToken(request.token().trim());
        PasswordResetToken resetToken = passwordResetTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new BadCredentialsException("Mã xác thực không hợp lệ hoặc đã hết hạn."));

        if (!resetToken.isValid()) {
            throw new BadCredentialsException("Mã xác thực không hợp lệ hoặc đã hết hạn.");
        }

        User user = resetToken.getUser();
        if (!user.isActive()) {
            throw new DisabledException("Tài khoản đang bị khóa.");
        }

        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);

        resetToken.setUsedAt(Instant.now());
        passwordResetTokenRepository.save(resetToken);

        // Invalidate any other active reset tokens for this user
        passwordResetTokenRepository.invalidateAllByUserId(user.getId(), Instant.now());

        // Revoke all existing sessions for this user across all devices
        refreshTokenService.revokeAllUserSessions(user.getId());
        log.info("Password reset successfully and all sessions revoked for user: {}", user.getEmail());
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResourceNotFoundException("No authenticated user found in security context");
        }

        String email = authentication.getName();
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
        return userMapper.toResponse(user);
    }
}
