package com.m4n.backend.service;

import com.m4n.backend.dto.request.ChangePasswordRequest;
import com.m4n.backend.dto.request.ForgotPasswordRequest;
import com.m4n.backend.dto.request.LoginRequest;
import com.m4n.backend.dto.request.RegisterRequest;
import com.m4n.backend.dto.request.ResetPasswordRequest;
import com.m4n.backend.dto.response.AuthResponse;
import com.m4n.backend.dto.response.UserResponse;

public interface AuthService {

    record LoginResult(AuthResponse authResponse, String rawRefreshToken) {}

    UserResponse register(RegisterRequest request);

    LoginResult login(LoginRequest request, String userAgent, String ipAddress);

    default LoginResult login(LoginRequest request) {
        return login(request, null, null);
    }

    LoginResult refresh(String rawRefreshToken, String userAgent, String ipAddress);

    void logout(String rawRefreshToken);

    void logoutAll(String currentUserEmail);

    void changePassword(String currentUserEmail, ChangePasswordRequest request);

    void forgotPassword(ForgotPasswordRequest request);

    void resetPassword(ResetPasswordRequest request);

    UserResponse getCurrentUser();
}
