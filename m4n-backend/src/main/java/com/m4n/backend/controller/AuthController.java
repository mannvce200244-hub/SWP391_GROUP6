package com.m4n.backend.controller;

import com.m4n.backend.dto.request.ChangePasswordRequest;
import com.m4n.backend.dto.request.ForgotPasswordRequest;
import com.m4n.backend.dto.request.LoginRequest;
import com.m4n.backend.dto.request.RegisterRequest;
import com.m4n.backend.dto.request.ResetPasswordRequest;
import com.m4n.backend.dto.response.AuthResponse;
import com.m4n.backend.dto.response.MessageResponse;
import com.m4n.backend.dto.response.UserResponse;
import com.m4n.backend.security.AuthCookieService;
import com.m4n.backend.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Authentication", description = "User registration, authentication, session tokens, and account security APIs")
public class AuthController {

    private final AuthService authService;
    private final AuthCookieService authCookieService;

    public AuthController(AuthService authService, AuthCookieService authCookieService) {
        this.authService = authService;
        this.authCookieService = authCookieService;
    }

    @PostMapping("/register")
    @Operation(summary = "Register a new Customer account", description = "Creates a new customer account. Role is automatically set to CUSTOMER.")
    public ResponseEntity<UserResponse> register(@Valid @RequestBody RegisterRequest request) {
        UserResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    @Operation(summary = "Login to account", description = "Authenticates user credentials, sets HttpOnly refresh cookie, and returns Bearer access token.")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest servletRequest
    ) {
        String userAgent = servletRequest.getHeader(HttpHeaders.USER_AGENT);
        String ipAddress = servletRequest.getRemoteAddr();

        AuthService.LoginResult result = authService.login(request, userAgent, ipAddress);
        ResponseCookie refreshCookie = authCookieService.createRefreshCookie(result.rawRefreshToken());

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
                .body(result.authResponse());
    }

    @PostMapping("/refresh")
    @Operation(summary = "Rotate refresh token and issue new access token", description = "Validates the HttpOnly refresh token cookie, rotates the token pair, and returns a new Bearer access token.")
    public ResponseEntity<AuthResponse> refresh(HttpServletRequest servletRequest) {
        String rawRefreshToken = authCookieService.extractRefreshTokenOrThrow(servletRequest);
        String userAgent = servletRequest.getHeader(HttpHeaders.USER_AGENT);
        String ipAddress = servletRequest.getRemoteAddr();

        AuthService.LoginResult result = authService.refresh(rawRefreshToken, userAgent, ipAddress);
        ResponseCookie newRefreshCookie = authCookieService.createRefreshCookie(result.rawRefreshToken());

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, newRefreshCookie.toString())
                .body(result.authResponse());
    }

    @PostMapping("/logout")
    @Operation(summary = "Logout current session", description = "Revokes the active refresh token session and clears the HttpOnly refresh cookie.")
    public ResponseEntity<Void> logout(HttpServletRequest servletRequest) {
        authCookieService.extractRefreshToken(servletRequest).ifPresent(authService::logout);

        ResponseCookie clearCookie = authCookieService.createClearCookie();
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, clearCookie.toString())
                .build();
    }

    @PostMapping("/logout-all")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Logout all sessions across devices", description = "Revokes all active refresh token sessions for the authenticated user and clears the current refresh cookie.")
    public ResponseEntity<Void> logoutAll(Authentication authentication) {
        authService.logoutAll(authentication.getName());

        ResponseCookie clearCookie = authCookieService.createClearCookie();
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, clearCookie.toString())
                .build();
    }

    @GetMapping("/me")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Get current authenticated user", description = "Returns user details derived securely from the SecurityContext.")
    public ResponseEntity<UserResponse> getCurrentUser() {
        UserResponse response = authService.getCurrentUser();
        return ResponseEntity.ok(response);
    }

    @PostMapping("/change-password")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Change account password", description = "Changes password for current user and revokes all active refresh sessions across devices.")
    public ResponseEntity<MessageResponse> changePassword(
            Authentication authentication,
            @Valid @RequestBody ChangePasswordRequest request
    ) {
        authService.changePassword(authentication.getName(), request);

        ResponseCookie clearCookie = authCookieService.createClearCookie();
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, clearCookie.toString())
                .body(new MessageResponse("Mật khẩu đã được thay đổi thành công. Vui lòng đăng nhập lại."));
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Request password reset instructions", description = "Dispatches password reset instructions if account exists. Returns a generic success response.")
    public ResponseEntity<MessageResponse> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request);
        return ResponseEntity.ok(new MessageResponse("Nếu địa chỉ email tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu sẽ được gửi."));
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Reset account password using token", description = "Validates the reset token, updates account password, and terminates all active sessions.")
    public ResponseEntity<MessageResponse> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);

        ResponseCookie clearCookie = authCookieService.createClearCookie();
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, clearCookie.toString())
                .body(new MessageResponse("Đặt lại mật khẩu thành công. Vui lòng đăng nhập bằng mật khẩu mới."));
    }
}
