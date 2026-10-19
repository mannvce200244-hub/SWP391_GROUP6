package com.m4n.backend.util;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HexFormat;

public final class TokenHashUtil {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private TokenHashUtil() {
        // Utility class
    }

    /**
     * Generates a cryptographically secure random raw token string.
     */
    public static String generateSecureRandomToken(int byteLength) {
        byte[] bytes = new byte[byteLength];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    /**
     * Generates a default 64-byte random raw token string.
     */
    public static String generateSecureRandomToken() {
        return generateSecureRandomToken(64);
    }

    /**
     * Computes the standard SHA-256 hex string of a raw token.
     */
    public static String hashToken(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            throw new IllegalArgumentException("Raw token cannot be null or blank");
        }
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hashBytes);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 algorithm not available", e);
        }
    }
}
