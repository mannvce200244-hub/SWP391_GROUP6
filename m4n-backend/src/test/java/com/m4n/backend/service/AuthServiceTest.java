package com.m4n.backend.service;

import com.m4n.backend.dto.request.ChangePasswordRequest;
import com.m4n.backend.dto.request.ForgotPasswordRequest;
import com.m4n.backend.dto.request.LoginRequest;
import com.m4n.backend.dto.request.RegisterRequest;
import com.m4n.backend.dto.request.ResetPasswordRequest;
import com.m4n.backend.dto.response.UserResponse;
import com.m4n.backend.entity.PasswordResetToken;
import com.m4n.backend.entity.Role;
import com.m4n.backend.entity.RoleName;
import com.m4n.backend.entity.User;
import com.m4n.backend.exception.DuplicateResourceException;
import com.m4n.backend.mapper.UserMapper;
import com.m4n.backend.repository.PasswordResetTokenRepository;
import com.m4n.backend.repository.RoleRepository;
import com.m4n.backend.repository.UserRepository;
import com.m4n.backend.repository.EmailOtpChallengeRepository;
import com.m4n.backend.security.JwtService;
import com.m4n.backend.service.serviceImpl.AuthServiceImpl;
import com.m4n.backend.util.TokenHashUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private RefreshTokenService refreshTokenService;

    @Mock
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Mock
    private PasswordResetNotifier passwordResetNotifier;
    @Mock private PasswordResetRequestService passwordResetRequestService;
    @Mock private EmailOtpChallengeRepository emailOtpChallenges;

    private UserMapper userMapper;
    private AuthService authService;

    @BeforeEach
    void setUp() {
        userMapper = new UserMapper();
        authService = new AuthServiceImpl(
                userRepository,
                roleRepository,
                passwordEncoder,
                jwtService,
                authenticationManager,
                userMapper,
                refreshTokenService,
                passwordResetTokenRepository,
                passwordResetNotifier,
                passwordResetRequestService,
                emailOtpChallenges
        );
    }

    @Test
    void registrationEmailNormalizationMatchesOtpRegardlessOfServerLocale() {
        java.util.Locale previous = java.util.Locale.getDefault();
        try {
            java.util.Locale.setDefault(java.util.Locale.forLanguageTag("tr-TR"));
            when(userRepository.existsByEmailIgnoreCase("instrument@example.test")).thenReturn(true);
            assertThatThrownBy(() -> authService.register(new RegisterRequest(
                    "Customer", " INSTRUMENT@example.test ", "SecurePassword123!", null)))
                    .isInstanceOf(DuplicateResourceException.class);
            verify(userRepository).existsByEmailIgnoreCase("instrument@example.test");
        } finally {
            java.util.Locale.setDefault(previous);
        }
    }

    @Test
    void shouldRegisterCustomerSuccessfully() {
        RegisterRequest request = new RegisterRequest(
                "Nguyễn Văn A",
                "customer@m4n.vn",
                "Password123!",
                "0900000001",
                "Hà Nội"
        );

        Role customerRole = Role.builder().id(1L).name(RoleName.CUSTOMER).build();
        User savedUser = User.builder()
                .id(10L)
                .fullName("Nguyễn Văn A")
                .email("customer@m4n.vn")
                .password("encoded_pass")
                .phone("0900000001")
                .address("Hà Nội")
                .role(customerRole)
                .isActive(true)
                .build();

        when(userRepository.existsByEmailIgnoreCase("customer@m4n.vn")).thenReturn(false);
        when(roleRepository.findByName(RoleName.CUSTOMER)).thenReturn(Optional.of(customerRole));
        when(passwordEncoder.encode("Password123!")).thenReturn("encoded_pass");
        when(userRepository.save(any(User.class))).thenReturn(savedUser);

        UserResponse response = authService.register(request);

        assertThat(response).isNotNull();
        assertThat(response.id()).isEqualTo(10L);
        assertThat(response.email()).isEqualTo("customer@m4n.vn");
        assertThat(response.role()).isEqualTo(RoleName.CUSTOMER);
        assertThat(response.address()).isEqualTo("Hà Nội");

        verify(userRepository).save(any(User.class));
    }

    @Test
    void shouldThrowDuplicateResourceExceptionWhenEmailExists() {
        RegisterRequest request = new RegisterRequest(
                "Test User",
                "duplicate@m4n.vn",
                "Password123!",
                "0900000002"
        );

        when(userRepository.existsByEmailIgnoreCase("duplicate@m4n.vn")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("Email is already registered");
    }

    @Test
    void shouldLoginSuccessfullyAndReturnTokenResult() {
        LoginRequest request = new LoginRequest("user@m4n.vn", "Password123!");
        Role role = Role.builder().id(1L).name(RoleName.CUSTOMER).build();
        User user = User.builder()
                .id(5L)
                .email("user@m4n.vn")
                .fullName("Test User")
                .role(role)
                .isActive(true)
                .build();

        when(userRepository.findByEmailIgnoreCaseWithLock("user@m4n.vn")).thenReturn(Optional.of(user));
        when(jwtService.generateToken(5L, "user@m4n.vn", RoleName.CUSTOMER, 0)).thenReturn("mock.jwt.token");
        when(jwtService.getExpirationSeconds()).thenReturn(900L);
        when(refreshTokenService.createRefreshToken(eq(user), any(), any()))
                .thenReturn(new RefreshTokenService.TokenPair(user, "raw-refresh-token-123"));

        AuthService.LoginResult result = authService.login(request, "Mozilla/5.0", "127.0.0.1");

        assertThat(result.authResponse().accessToken()).isEqualTo("mock.jwt.token");
        assertThat(result.authResponse().tokenType()).isEqualTo("Bearer");
        assertThat(result.authResponse().expiresIn()).isEqualTo(900L);
        assertThat(result.authResponse().user().email()).isEqualTo("user@m4n.vn");
        assertThat(result.rawRefreshToken()).isEqualTo("raw-refresh-token-123");

        verify(authenticationManager).authenticate(
                new UsernamePasswordAuthenticationToken("user@m4n.vn", "Password123!")
        );
    }

    @Test
    void shouldRejectLoginWhenAccountIsInactive() {
        LoginRequest request = new LoginRequest("inactive@m4n.vn", "Password123!");
        Role role = Role.builder().id(1L).name(RoleName.CUSTOMER).build();
        User user = User.builder()
                .id(6L)
                .email("inactive@m4n.vn")
                .fullName("Inactive User")
                .role(role)
                .isActive(false)
                .build();

        when(userRepository.findByEmailIgnoreCaseWithLock("inactive@m4n.vn")).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(DisabledException.class)
                .hasMessageContaining("Account is inactive.");
    }

    @Test
    void shouldRotateRefreshTokenSuccessfully() {
        Role role = Role.builder().id(1L).name(RoleName.CUSTOMER).build();
        User user = User.builder()
                .id(7L)
                .email("rotate@m4n.vn")
                .role(role)
                .isActive(true)
                .build();

        when(refreshTokenService.rotateRefreshToken(eq("old-token"), any(), any()))
                .thenReturn(new RefreshTokenService.TokenPair(user, "new-token-456"));
        when(jwtService.generateToken(7L, "rotate@m4n.vn", RoleName.CUSTOMER, 0)).thenReturn("new.access.token");
        when(jwtService.getExpirationSeconds()).thenReturn(900L);

        AuthService.LoginResult result = authService.refresh("old-token", "Mozilla", "127.0.0.1");

        assertThat(result.authResponse().accessToken()).isEqualTo("new.access.token");
        assertThat(result.rawRefreshToken()).isEqualTo("new-token-456");
    }

    @Test
    void shouldChangePasswordSuccessfullyAndRevokeSessions() {
        ChangePasswordRequest request = new ChangePasswordRequest("OldPassword123!", "NewPassword123!", "NewPassword123!");
        User user = User.builder()
                .id(8L)
                .email("changepass@m4n.vn")
                .password("encoded_old_pass")
                .isActive(true)
                .build();

        when(userRepository.findByEmailIgnoreCaseWithLock("changepass@m4n.vn")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("OldPassword123!", "encoded_old_pass")).thenReturn(true);
        when(passwordEncoder.matches("NewPassword123!", "encoded_old_pass")).thenReturn(false);
        when(passwordEncoder.encode("NewPassword123!")).thenReturn("encoded_new_pass");

        authService.changePassword("changepass@m4n.vn", request);

        verify(userRepository).save(user);
        verify(refreshTokenService).revokeAllUserSessions(8L);
    }

    @Test
    void shouldRejectChangePasswordWhenCurrentPasswordWrong() {
        ChangePasswordRequest request = new ChangePasswordRequest("WrongPass!", "NewPassword123!", "NewPassword123!");
        User user = User.builder()
                .id(8L)
                .email("changepass@m4n.vn")
                .password("encoded_old_pass")
                .build();

        when(userRepository.findByEmailIgnoreCaseWithLock("changepass@m4n.vn")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("WrongPass!", "encoded_old_pass")).thenReturn(false);

        assertThatThrownBy(() -> authService.changePassword("changepass@m4n.vn", request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Mật khẩu hiện tại không chính xác.");
    }

    @Test
    void shouldHandleForgotPasswordForExistingUser() {
        ForgotPasswordRequest request = new ForgotPasswordRequest("existing@m4n.vn");
        when(passwordResetNotifier.isAvailable()).thenReturn(true);

        authService.forgotPassword(request);

        verify(passwordResetRequestService).requestReset("existing@m4n.vn");
    }

    @Test
    void unavailablePasswordResetDeliveryRejectsBeforeAnyAccountLookup() {
        assertThatThrownBy(() -> authService.forgotPassword(new ForgotPasswordRequest("existing@m4n.vn")))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode().value()).isEqualTo(503));
        assertThatThrownBy(() -> authService.forgotPassword(new ForgotPasswordRequest("unknown@m4n.vn")))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode().value()).isEqualTo(503));
        verify(userRepository, never()).findByEmailIgnoreCaseWithLock(any());
        verify(passwordResetTokenRepository, never()).save(any());
    }

    @Test
    void shouldResetPasswordSuccessfully() {
        String rawToken = "valid-reset-token";
        String tokenHash = TokenHashUtil.hashToken(rawToken);
        ResetPasswordRequest request = new ResetPasswordRequest(rawToken, "BrandNewPass123!", "BrandNewPass123!");

        User user = User.builder()
                .id(10L)
                .email("resetuser@m4n.vn")
                .password("old_pass")
                .isActive(true)
                .build();

        PasswordResetToken resetToken = PasswordResetToken.builder()
                .id(1L)
                .user(user)
                .tokenHash(tokenHash)
                .expiresAt(Instant.now().plus(15, ChronoUnit.MINUTES))
                .build();

        when(passwordResetTokenRepository.findByTokenHash(tokenHash)).thenReturn(Optional.of(resetToken));
        when(passwordResetTokenRepository.findUserIdByTokenHash(tokenHash)).thenReturn(Optional.of(user.getId()));
        when(userRepository.findByIdWithLock(user.getId())).thenReturn(Optional.of(user));
        when(passwordEncoder.encode("BrandNewPass123!")).thenReturn("encoded_brand_new_pass");

        authService.resetPassword(request);

        assertThat(resetToken.getUsedAt()).isNotNull();
        verify(userRepository).save(user);
        verify(passwordResetTokenRepository).save(resetToken);
        verify(refreshTokenService).revokeAllUserSessions(10L);
    }
    @Test
    void rejectsPasswordsExceedingBcryptUtf8LimitBeforeChangingAccounts() {
        String oversized = "ấ".repeat(25);
        assertThatThrownBy(() -> authService.register(
                new RegisterRequest("UTF-8 customer", "utf8@m4n.test", oversized, null)))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("72 byte UTF-8");
        assertThatThrownBy(() -> authService.changePassword("utf8@m4n.test",
                new ChangePasswordRequest("Password123!", oversized, oversized)))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("72 byte UTF-8");
        assertThatThrownBy(() -> authService.resetPassword(
                new ResetPasswordRequest("token", oversized, oversized)))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("72 byte UTF-8");
        verify(userRepository, never()).save(any());
        verify(passwordEncoder, never()).encode(any());
    }
}
