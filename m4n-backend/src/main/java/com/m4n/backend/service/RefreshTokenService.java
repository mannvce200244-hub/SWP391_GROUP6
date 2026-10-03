package com.m4n.backend.service;

import com.m4n.backend.entity.User;

public interface RefreshTokenService {

    record TokenPair(User user, String rawRefreshToken) {}

    TokenPair createRefreshToken(User user, String userAgent, String ipAddress);

    TokenPair rotateRefreshToken(String rawRefreshToken, String userAgent, String ipAddress);

    void revokeRefreshToken(String rawRefreshToken);

    void revokeAllUserSessions(Long userId);

    void cleanupExpiredTokens();
}
