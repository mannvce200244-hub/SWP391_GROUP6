package com.m4n.backend.exception;

import com.m4n.backend.dto.response.EmailOtpResponse;
import lombok.Getter;

@Getter
public class RegistrationVerificationRequiredException extends RuntimeException {
    private final String email;
    private final EmailOtpResponse challenge;

    public RegistrationVerificationRequiredException(String email, EmailOtpResponse challenge) {
        super("Vui lòng xác minh OTP email để hoàn tất đăng ký trước khi đăng nhập.");
        this.email = email;
        this.challenge = challenge;
    }
}
