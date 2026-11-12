package com.m4n.backend.service.serviceImpl;

import com.m4n.backend.service.EmailOtpNotifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import jakarta.mail.MessagingException;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import java.io.UnsupportedEncodingException;
import java.nio.charset.StandardCharsets;

@Service
@ConditionalOnProperty(
        name = "m4n.auth.otp-email.provider", havingValue = "gmail", matchIfMissing = true)
public class GmailEmailOtpNotifier implements EmailOtpNotifier {
    private final JavaMailSender sender;
    private final boolean enabled;
    private final String username;
    private final String password;

    public GmailEmailOtpNotifier(ObjectProvider<JavaMailSender> sender,
            @Value("${m4n.auth.otp-email.enabled:false}") boolean enabled,
            @Value("${spring.mail.username:}") String username,
            @Value("${spring.mail.password:}") String password) {
        this.sender = sender.getIfAvailable();
        this.enabled = enabled;
        this.username = username;
        this.password = password;
    }

    @Override
    public boolean isAvailable() {
        return enabled && sender != null && !username.isBlank() && !password.isBlank();
    }

    @Override
    public void sendCode(String email, String code, String purpose) {
        if (!isAvailable()) throw unavailable();
        String action = EmailOtpMessage.action(purpose);
        try {
            var message = sender.createMimeMessage();
            var helper = new MimeMessageHelper(message, true, StandardCharsets.UTF_8.name());
            helper.setFrom(username, "M4N");
            helper.setTo(email);
            helper.setSubject(EmailOtpMessage.subject(action));
            helper.setText(EmailOtpMessage.text(code, action), EmailOtpMessage.html(code, action));
            sender.send(message);
        } catch (MailException | MessagingException | UnsupportedEncodingException ex) {
            // Provider details can contain SMTP credentials or recipient data.
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Chưa thể gửi email xác thực. Vui lòng thử lại sau.");
        }
    }

    private ResponseStatusException unavailable() {
        return new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                "Dịch vụ OTP email chưa được cấu hình. Vui lòng liên hệ bộ phận hỗ trợ.");
    }
}
