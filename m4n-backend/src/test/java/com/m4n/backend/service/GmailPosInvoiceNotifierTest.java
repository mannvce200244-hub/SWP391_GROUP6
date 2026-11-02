package com.m4n.backend.service;

import com.m4n.backend.service.serviceImpl.GmailPosInvoiceNotifier;
import jakarta.mail.Multipart;
import jakarta.mail.Part;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;
import java.math.BigDecimal;
import java.util.Properties;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class GmailPosInvoiceNotifierTest {
    @Test void sendsUtf8ReceiptWithCorrectRecipientAndPdfAttachment() throws Exception {
        var sender = mock(JavaMailSender.class);
        var message = new MimeMessage(Session.getInstance(new Properties()));
        when(sender.createMimeMessage()).thenReturn(message);
        byte[] pdf = "%PDF-receipt".getBytes(java.nio.charset.StandardCharsets.UTF_8);
        notifier(sender, true).sendInvoice("buyer@example.test", "POS-123", BigDecimal.valueOf(5800000), pdf);
        message.saveChanges();
        verify(sender).send(message);
        assertThat(message.getSubject()).isEqualTo("M4N — Hóa đơn mua hàng POS-123");
        assertThat(message.getAllRecipients()).hasSize(1);
        assertThat(message.getAllRecipients()[0].toString()).isEqualTo("buyer@example.test");
        assertThat(body(message, "text/plain")).contains("POS-123", "MoMo", "PDF");
        assertThat(body(message, "text/html")).contains("lang=\"vi\"", "POS-123", "#FFFFFF");
        Part attachment = attachment(message);
        assertThat(attachment).isNotNull();
        assertThat(attachment.getFileName()).isEqualTo("M4N-POS-123.pdf");
        assertThat(attachment.isMimeType("application/pdf")).isTrue();
        assertThat(attachment.getInputStream().readAllBytes()).isEqualTo(pdf);
    }

    @Test void escapesHtmlAndDoesNotExposeSmtpFailureDetails() throws Exception {
        var sender = mock(JavaMailSender.class);
        var message = new MimeMessage(Session.getInstance(new Properties()));
        when(sender.createMimeMessage()).thenReturn(message);
        notifier(sender, true).sendInvoice("buyer@example.test", "POS-<script>", BigDecimal.TEN, new byte[]{1});
        message.saveChanges();
        assertThat(body(message, "text/html")).contains("POS-&lt;script&gt;").doesNotContain("<script>");
        doThrow(new MailSendException("private SMTP credentials")).when(sender).send(any(MimeMessage.class));
        assertThatThrownBy(() -> notifier(sender, true).sendInvoice("buyer@example.test", "POS-1", BigDecimal.TEN, new byte[]{1}))
                .isInstanceOf(IllegalStateException.class).hasMessageNotContaining("private SMTP");
    }

    @Test void disabledOrMissingSmtpDoesNotSend() {
        var sender = mock(JavaMailSender.class);
        assertThat(notifier(sender, false).isAvailable()).isFalse();
        assertThatThrownBy(() -> notifier(sender, false).sendInvoice("buyer@example.test", "POS-1", BigDecimal.TEN, new byte[]{1}))
                .isInstanceOf(IllegalStateException.class);
        verifyNoInteractions(sender);
        assertThat(notifier(null, true).isAvailable()).isFalse();
    }

    @SuppressWarnings("unchecked")
    private GmailPosInvoiceNotifier notifier(JavaMailSender sender, boolean enabled) {
        ObjectProvider<JavaMailSender> provider = mock(ObjectProvider.class);
        when(provider.getIfAvailable()).thenReturn(sender);
        return new GmailPosInvoiceNotifier(provider, enabled, "sender@example.test", "fixture-secret");
    }
    private String body(Part part, String type) throws Exception {
        if (part.isMimeType(type)) return (String) part.getContent();
        if (part.getContent() instanceof Multipart parts) {
            for (int i = 0; i < parts.getCount(); i++) {
                var found = body(parts.getBodyPart(i), type);
                if (!found.isEmpty()) return found;
            }
        }
        return "";
    }
    private Part attachment(Part part) throws Exception {
        if (Part.ATTACHMENT.equalsIgnoreCase(part.getDisposition())) return part;
        if (part.getContent() instanceof Multipart parts) {
            for (int i = 0; i < parts.getCount(); i++) {
                var found = attachment(parts.getBodyPart(i));
                if (found != null) return found;
            }
        }
        return null;
    }
}
