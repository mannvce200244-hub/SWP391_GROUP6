package com.m4n.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;

@Component
public record GoogleLoginProperties(
        @Value("${m4n.auth.google.enabled:false}") boolean enabled,
        @Value("${m4n.auth.google.client-id:}") String clientId,
        @Value("${m4n.auth.google.client-secret:}") String clientSecret,
        @Value("${m4n.auth.google.redirect-uri:http://localhost:5173/api/v1/auth/google/callback/google}") String redirectUri,
        @Value("${m4n.auth.google.frontend-url:${m4n.frontend.url:http://localhost:5173}}") String frontendUrl) {

    public GoogleLoginProperties {
        if (enabled) {
            if (clientId.isBlank() || clientSecret.isBlank()) {
                throw new IllegalArgumentException("Google login requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.");
            }
            URI frontend = URI.create(frontendUrl);
            URI callback = URI.create(redirectUri);
            boolean localHttp = "http".equals(frontend.getScheme())
                    && ("localhost".equals(frontend.getHost()) || "127.0.0.1".equals(frontend.getHost()));
            boolean legacyLocal = localHttp && frontend.getScheme().equals(callback.getScheme())
                    && frontend.getHost().equals(callback.getHost()) && callback.getPort() == 8080
                    && "/login/oauth2/code/google".equals(callback.getPath());
            if (!("https".equals(frontend.getScheme()) || localHttp) || frontend.getHost() == null
                    || frontend.getUserInfo() != null || frontend.getQuery() != null || frontend.getFragment() != null
                    || !(frontend.getPath().isEmpty() || frontend.getPath().equals("/"))
                    || !frontend.getScheme().equals(callback.getScheme()) || !frontend.getHost().equals(callback.getHost())
                    || (!legacyLocal && frontend.getPort() != callback.getPort()) || callback.getUserInfo() != null
                    || callback.getQuery() != null || callback.getFragment() != null
                    || (!legacyLocal && !"/api/v1/auth/google/callback/google".equals(callback.getPath()))) {
                throw new IllegalArgumentException("Google callback must use the trusted frontend origin and /api/v1/auth/google/callback/google.");
            }
        }
    }

    public String loginUrl(String outcome) {
        return frontendUrl.replaceAll("/+$", "") + "/login?google=" + outcome;
    }

    // Do not let generated record output expose clientSecret in diagnostic logs.
    @Override
    public String toString() {
        return "GoogleLoginProperties[enabled=" + enabled + "]";
    }
}
