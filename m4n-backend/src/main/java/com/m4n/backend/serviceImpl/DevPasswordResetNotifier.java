package com.m4n.backend.serviceImpl;

import com.m4n.backend.service.PasswordResetNotifier;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Slf4j
@Service
public class DevPasswordResetNotifier implements PasswordResetNotifier {

    @Value("${m4n.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @Override
    public void sendPasswordResetNotification(String email, String rawToken) {
        String encodedToken = URLEncoder.encode(rawToken, StandardCharsets.UTF_8);
        String resetUrl = frontendUrl.replaceAll("/+$", "") + "/reset-password?token=" + encodedToken;

        log.info("[PASSWORD RESET NOTIFICATION] To: {}, Reset URL: {}", email, resetUrl);
    }
}
