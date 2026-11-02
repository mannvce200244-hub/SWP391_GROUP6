package com.m4n.backend.service.serviceImpl;

import com.m4n.backend.exception.PasswordResetDeliveryException;
import com.m4n.backend.service.PasswordResetNotifier;
import com.m4n.backend.util.TokenHashUtil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.net.http.HttpClient;
import java.time.Duration;
import java.util.List;
import java.util.Map;

@Service
public class ResendPasswordResetNotifier implements PasswordResetNotifier {
    private final RestClient client;
    private final String apiKey;
    private final String from;
    private final String resetUrl;
    private final long expirationMinutes;
    private final boolean enabled;

    public ResendPasswordResetNotifier(RestClient.Builder builder,
            @Value("${m4n.auth.reset-email.enabled:false}") boolean enabled,
            @Value("${m4n.auth.reset-email.api-key:}") String apiKey,
            @Value("${m4n.auth.reset-email.from:}") String from,
            @Value("${m4n.frontend.url:http://localhost:5173}") String frontendUrl,
            @Value("${m4n.auth.password-reset-expiration-minutes:15}") long expirationMinutes) {
        this.enabled = enabled;
        this.apiKey = apiKey;
        this.from = from;
        this.expirationMinutes = expirationMinutes;
        this.resetUrl = frontendUrl.replaceAll("/+$", "") + "/reset-password";
        var factory = new JdkClientHttpRequestFactory(HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5)).followRedirects(HttpClient.Redirect.NEVER).build());
        factory.setReadTimeout(Duration.ofSeconds(10));
        this.client = builder.baseUrl("https://api.resend.com").requestFactory(factory).build();
        if (enabled && (!isAvailable() || !isSafeFrontendUrl(frontendUrl))) {
            throw new IllegalStateException("Enabled reset email requires RESEND_API_KEY, RESET_EMAIL_FROM and a valid HTTPS FRONTEND_URL (HTTP loopback allowed locally).");
        }
    }

    @Override
    public boolean isAvailable() {
        return enabled && !apiKey.isBlank() && !apiKey.contains("\r") && !apiKey.contains("\n")
                && from.matches("[^\\s<>@]+@[^\\s<>@]+\\.[^\\s<>@]+") && expirationMinutes > 0;
    }

    @Override
    public void sendPasswordResetNotification(String email, String rawToken) {
        if (!isAvailable()) throw new PasswordResetDeliveryException();
        String link = UriComponentsBuilder.fromUriString(resetUrl).queryParam("token", rawToken)
                .build().encode().toUriString();
        try {
            Map<?, ?> response = client.post().uri("/emails")
                    .header("Authorization", "Bearer " + apiKey)
                    .header("User-Agent", "m4n-backend/1.0")
                    .header("Idempotency-Key", "password-reset/" + TokenHashUtil.hashToken(rawToken))
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("from", from, "to", List.of(email), "subject", "M4N — Đặt lại mật khẩu",
                            "text", "Mở liên kết sau để đặt lại mật khẩu M4N:\n" + link
                                    + "\nLiên kết hết hạn sau " + expirationMinutes + " phút. Nếu bạn không yêu cầu, hãy bỏ qua email này."))
                    .retrieve().body(Map.class);
            if (response == null || !(response.get("id") instanceof String id) || id.isBlank()) {
                throw new PasswordResetDeliveryException();
            }
        } catch (RestClientException ex) {
            // Provider bodies may include addresses or token-bearing content; never propagate them.
            throw new PasswordResetDeliveryException();
        }
    }

    private boolean isSafeFrontendUrl(String value) {
        try {
            URI uri = URI.create(value);
            return uri.getHost() != null && uri.getUserInfo() == null && uri.getQuery() == null
                    && uri.getFragment() == null && ("https".equals(uri.getScheme())
                    || ("http".equals(uri.getScheme()) && List.of("localhost", "127.0.0.1", "::1").contains(uri.getHost())));
        } catch (IllegalArgumentException ex) {
            return false;
        }
    }
}
