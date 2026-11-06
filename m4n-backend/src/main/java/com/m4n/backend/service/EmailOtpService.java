package com.m4n.backend.service;
import com.m4n.backend.dto.request.*;
import com.m4n.backend.dto.response.*;

public interface EmailOtpService {
    EmailOtpResponse startRegistration(RegisterRequest request);
    UserResponse verifyRegistration(VerifyRegistrationRequest request);
    VerifiedResetOtpResponse verifyResetOtp(VerifyResetOtpRequest request);
    EmailOtpResponse requestCode(EmailOtpRequest request);
    UserResponse register(VerifiedRegisterRequest request);
    void resetPassword(OtpResetPasswordRequest request);
}
