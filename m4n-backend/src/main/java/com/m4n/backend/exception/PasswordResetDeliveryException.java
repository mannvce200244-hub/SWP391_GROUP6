package com.m4n.backend.exception;

public class PasswordResetDeliveryException extends RuntimeException {
    public PasswordResetDeliveryException() {
        super("Password reset delivery was not confirmed.");
    }
}
