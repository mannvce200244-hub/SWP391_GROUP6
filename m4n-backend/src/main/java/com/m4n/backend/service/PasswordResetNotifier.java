package com.m4n.backend.service;

public interface PasswordResetNotifier {
    boolean isAvailable();

    void sendPasswordResetNotification(String email, String rawToken);
}
