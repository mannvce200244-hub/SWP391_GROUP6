package com.m4n.backend.service;

public interface GoogleLoginService {
    record Identity(String subject, String email, String fullName, boolean emailVerified, String hostedDomain) {}

    String signIn(Identity identity, String userAgent, String ipAddress);
}
