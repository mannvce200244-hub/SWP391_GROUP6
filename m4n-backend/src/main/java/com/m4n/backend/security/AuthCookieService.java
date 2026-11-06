package com.m4n.backend.security;

import com.m4n.backend.util.CookieUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Component;

import java.util.Optional;

/**
 * Dedicated HTTP adapter component responsible for creating, clearing,
 * and extracting authentication refresh cookies. Keeps HTTP cookie configuration
 * details out of the Controller and domain service layers.
 */
@Component
public class AuthCookieService {

    private final long refreshExpirationDays;
    private final boolean cookieSecure;

    public AuthCookieService(
            @Value("${m4n.jwt.refresh-expiration-days:7}") long refreshExpirationDays,
            @Value("${m4n.auth.cookie.secure:false}") boolean cookieSecure
    ) {
        this.refreshExpirationDays = refreshExpirationDays;
        this.cookieSecure = cookieSecure;
    }

    /**
     * Creates an HttpOnly cookie containing the raw refresh token.
     */
    public ResponseCookie createRefreshCookie(String rawRefreshToken) {
        return CookieUtil.createRefreshTokenCookie(rawRefreshToken, refreshExpirationDays, cookieSecure);
    }

    /**
     * Creates an expired HttpOnly cookie to clear the refresh token session in the browser.
     */
    public ResponseCookie createClearCookie() {
        return CookieUtil.createClearRefreshTokenCookie(cookieSecure);
    }

    /**
     * Extracts the raw refresh token from the request cookie if present.
     */
    public Optional<String> extractRefreshToken(HttpServletRequest request) {
        return CookieUtil.extractRefreshTokenFromCookie(request);
    }

    /**
     * Extracts the raw refresh token or throws BadCredentialsException if missing.
     */
    public String extractRefreshTokenOrThrow(HttpServletRequest request) {
        return extractRefreshToken(request)
                .orElseThrow(() -> new BadCredentialsException("Refresh token cookie not found."));
    }
}
