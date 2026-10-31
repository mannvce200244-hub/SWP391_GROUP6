package com.m4n.backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

/** Prevents simple browser requests from rotating or revoking cookie-authenticated sessions. */
public final class AuthCookieRequestFilter extends OncePerRequestFilter {
    private static final Set<String> COOKIE_ENDPOINTS = Set.of("/api/v1/auth/refresh", "/api/v1/auth/logout");
    private final Set<String> allowedOrigins;
    private final JwtAccessDeniedHandler deniedHandler;

    public AuthCookieRequestFilter(String origins, JwtAccessDeniedHandler deniedHandler) {
        this.allowedOrigins = Arrays.stream(origins.split(",")).map(String::trim)
                .filter(origin -> !origin.isEmpty()).collect(Collectors.toUnmodifiableSet());
        this.deniedHandler = deniedHandler;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI().substring(request.getContextPath().length());
        return !"POST".equals(request.getMethod()) || !COOKIE_ENDPOINTS.contains(path);
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String origin = request.getHeader("Origin");
        // This non-safelisted header forces a CORS preflight for cross-origin browser requests.
        // Explicit Origin validation also rejects untrusted same-site sibling origins.
        if (!"M4N".equals(request.getHeader("X-Requested-With"))
                || (origin != null && !allowedOrigins.contains(origin))) {
            deniedHandler.handle(request, response, new AccessDeniedException("Untrusted cookie request."));
            return;
        }
        chain.doFilter(request, response);
    }
}
