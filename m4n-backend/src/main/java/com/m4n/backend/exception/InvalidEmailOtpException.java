package com.m4n.backend.exception;

public class InvalidEmailOtpException extends IllegalArgumentException {
    public InvalidEmailOtpException() {
        super("Mã OTP không hợp lệ, đã hết hạn hoặc đã dùng. Vui lòng yêu cầu mã mới nếu cần.");
    }
}
