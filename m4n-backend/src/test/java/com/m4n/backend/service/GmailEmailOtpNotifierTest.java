package com.m4n.backend.service;

import com.m4n.backend.service.serviceImpl.GmailEmailOtpNotifier;
import jakarta.mail.Multipart;
import jakarta.mail.Part;
import jakarta.mail.Session;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.web.server.ResponseStatusException;
import java.util.Properties;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class GmailEmailOtpNotifierTest {
    @ParameterizedTest
    @CsvSource({"REGISTER,đăng ký tài khoản", "RESET_PASSWORD,đặt lại mật khẩu"})
    void sendsBrandedUtf8EmailWithPlainTextAndHtmlAlternatives(String purpose, String action) throws Exception {
        JavaMailSender sender = mock(JavaMailSender.class);
        MimeMessage message = new MimeMessage(Session.getInstance(new Properties()));
        when(sender.createMimeMessage()).thenReturn(message);
        notifier(sender).sendCode("recipient@example.test", "123456", purpose);
        message.saveChanges();
        verify(sender).send(message);
        assertThat(message.getSubject()).isEqualTo("M4N — Mã xác thực " + action);
        var from = (InternetAddress) message.getFrom()[0];
        assertThat(from.getPersonal()).isEqualTo("M4N");
        assertThat(from.getAddress()).isEqualTo("sender@example.test");
        assertThat(message.getAllRecipients()[0].toString()).isEqualTo("recipient@example.test");
        assertThat(body(message, "text/plain")).contains("123456", "10 phút", "mã cũ sẽ hết hiệu lực");
        assertThat(body(message, "text/html")).contains("lang=\"vi\"", "Xác thực " + action,
                "123456", "email mới nhất", "#FFFFFF", "width:100%;");
        assertThat(body(message, "text/html")).doesNotContain("<script", "http://", "https://");
    }

    @Test void deliveryFailureReturnsSafeMessage() {
        JavaMailSender sender = mock(JavaMailSender.class);
        when(sender.createMimeMessage()).thenReturn(new MimeMessage(Session.getInstance(new Properties())));
        doThrow(new MailSendException("private SMTP provider details")).when(sender).send(any(MimeMessage.class));
        assertThatThrownBy(() -> notifier(sender).sendCode("recipient@example.test", "123456", "REGISTER"))
                .isInstanceOf(ResponseStatusException.class).hasMessageContaining("503")
                .hasMessageNotContaining("private SMTP");
    }

    @SuppressWarnings("unchecked")
    private GmailEmailOtpNotifier notifier(JavaMailSender sender) {
        ObjectProvider<JavaMailSender> provider = mock(ObjectProvider.class);
        when(provider.getIfAvailable()).thenReturn(sender);
        return new GmailEmailOtpNotifier(provider, true, "sender@example.test", "fixture-password");
    }

    private String body(Part part, String mimeType) throws Exception {
        if (part.isMimeType(mimeType)) return (String) part.getContent();
        if (part.getContent() instanceof Multipart multipart) {
            for (int i = 0; i < multipart.getCount(); i++) {
                String found = body(multipart.getBodyPart(i), mimeType);
                if (!found.isEmpty()) return found;
            }
        }
        return "";
    }
}
