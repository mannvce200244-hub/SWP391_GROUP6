package com.m4n.backend.service;

public interface PasswordResetRequestService {
    void requestReset(String normalizedEmail);
}
