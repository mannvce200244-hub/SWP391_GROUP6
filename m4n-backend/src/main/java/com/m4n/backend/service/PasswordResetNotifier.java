package com.m4n.backend.service;

public interface PasswordResetNotifier {
    void sendPasswordResetNotification(String email, String rawToken);
}
