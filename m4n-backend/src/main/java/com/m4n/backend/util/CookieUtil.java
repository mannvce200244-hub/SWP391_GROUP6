package com.m4n.backend.util;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseCookie;

import java.time.Duration;
import java.util.Arrays;
import java.util.Optional;

public final class CookieUtil {

    public static final String REFRESH_TOKEN_COOKIE_NAME = "m4n_refresh_token";
    public static final String AUTH_COOKIE_PATH = "/api/v1/auth";

    private CookieUtil() {
        // Utility class
    }

    public static ResponseCookie createRefreshTokenCookie(String rawRefreshToken, long maxAgeDays, boolean secure) {
        return ResponseCookie.from(REFRESH_TOKEN_COOKIE_NAME, rawRefreshToken)
                .httpOnly(true)
                .secure(secure)
                .path(AUTH_COOKIE_PATH)
                .maxAge(Duration.ofDays(maxAgeDays))
                .sameSite("Lax")
                .build();
    }

    public static ResponseCookie createClearRefreshTokenCookie(boolean secure) {
        return ResponseCookie.from(REFRESH_TOKEN_COOKIE_NAME, "")
                .httpOnly(true)
                .secure(secure)
                .path(AUTH_COOKIE_PATH)
                .maxAge(0)
                .sameSite("Lax")
                .build();
    }

    public static Optional<String> extractRefreshTokenFromCookie(HttpServletRequest request) {
        if (request == null || request.getCookies() == null) {
            return Optional.empty();
        }
        return Arrays.stream(request.getCookies())
                .filter(cookie -> REFRESH_TOKEN_COOKIE_NAME.equals(cookie.getName()))
                .map(Cookie::getValue)
                .filter(val -> val != null && !val.isBlank())
                .findFirst();
    }
}
