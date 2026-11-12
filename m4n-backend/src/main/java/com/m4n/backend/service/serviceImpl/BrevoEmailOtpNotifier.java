package com.m4n.backend.service.serviceImpl;

import com.m4n.backend.service.EmailOtpNotifier;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.server.ResponseStatusException;

import java.net.http.HttpClient;
import java.time.Duration;
import java.util.List;
import java.util.Map;

@Service
@ConditionalOnProperty(name = "m4n.auth.otp-email.provider", havingValue = "brevo")
public class BrevoEmailOtpNotifier implements EmailOtpNotifier {
    private static final Logger log = LoggerFactory.getLogger(BrevoEmailOtpNotifier.class);
    private final RestClient client;
    private final boolean enabled;
    private final String apiKey;
    private final String from;

    public BrevoEmailOtpNotifier(RestClient.Builder builder,
            @Value("${m4n.auth.otp-email.enabled:false}") boolean enabled,
            @Value("${m4n.auth.otp-email.api-key:}") String apiKey,
            @Value("${m4n.auth.otp-email.from:}") String from) {
        this.enabled = enabled;
        this.apiKey = apiKey;
        this.from = from;
        var factory = new JdkClientHttpRequestFactory(HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5)).followRedirects(HttpClient.Redirect.NEVER).build());
        factory.setReadTimeout(Duration.ofSeconds(10));
        this.client = builder.baseUrl("https://api.brevo.com").requestFactory(factory).build();
        if (enabled && !isAvailable()) {
            throw new IllegalStateException("Brevo OTP requires BREVO_API_KEY (not an SMTP key) and a verified OTP_EMAIL_FROM sender.");
        }
    }

    @Override
    public boolean isAvailable() {
        return enabled && !apiKey.isBlank() && !apiKey.startsWith("xsmtpsib-")
                && apiKey.chars().noneMatch(Character::isWhitespace)
                && from.matches("[^\\s<>@]+@[^\\s<>@]+\\.[^\\s<>@]+");
    }

    @Override
    public void sendCode(String email, String code, String purpose) {
        if (!isAvailable()) throw unavailable();
        String action = EmailOtpMessage.action(purpose);
        try {
            Map<?, ?> result = client.post().uri("/v3/smtp/email")
                    .header("api-key", apiKey).header("User-Agent", "m4n-backend/1.0")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("sender", Map.of("name", "M4N", "email", from),
                            "to", List.of(Map.of("email", email)), "subject", EmailOtpMessage.subject(action),
                            "textContent", EmailOtpMessage.text(code, action), "htmlContent", EmailOtpMessage.html(code, action)))
                    .retrieve().body(Map.class);
            if (result == null || !(result.get("messageId") instanceof String id) || id.isBlank()) {
                log.warn("OTP Brevo delivery failed: invalid acceptance response.");
                throw unavailable();
            }
        } catch (RestClientResponseException ex) {
            // Provider bodies can contain recipients, credentials or OTPs; log status only.
            log.warn("OTP Brevo delivery rejected: HTTP {}.", ex.getStatusCode().value());
            throw unavailable();
        } catch (RestClientException ex) {
            log.warn("OTP Brevo delivery failed: transport or response error.");
            throw unavailable();
        }
    }

    private ResponseStatusException unavailable() {
        return new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                "Chưa thể gửi email xác thực. Vui lòng thử lại sau.");
    }
}
