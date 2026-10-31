package com.m4n.backend.service;

public interface EmailOtpNotifier {
    boolean isAvailable();
    void sendCode(String email, String code, String purpose);
}
