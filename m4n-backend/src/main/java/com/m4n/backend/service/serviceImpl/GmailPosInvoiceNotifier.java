package com.m4n.backend.service.serviceImpl;

import com.m4n.backend.service.PosInvoiceNotifier;
import jakarta.mail.MessagingException;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.web.util.HtmlUtils;

import java.io.UnsupportedEncodingException;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.text.NumberFormat;
import java.util.Locale;

@Service
public class GmailPosInvoiceNotifier implements PosInvoiceNotifier {
    private final JavaMailSender sender;
    private final boolean enabled;
    private final String username;
    private final String password;

    public GmailPosInvoiceNotifier(ObjectProvider<JavaMailSender> sender,
            @Value("${m4n.pos.invoice-email.enabled:true}") boolean enabled,
            @Value("${spring.mail.username:}") String username,
            @Value("${spring.mail.password:}") String password) {
        this.sender = sender.getIfAvailable();
        this.enabled = enabled;
        this.username = username;
        this.password = password;
    }

    @Override public boolean isAvailable() {
        return enabled && sender != null && !username.isBlank() && !password.isBlank();
    }

    @Override public void sendInvoice(String email, String invoiceCode, BigDecimal amount, byte[] pdf) {
        if (!isAvailable()) throw new IllegalStateException("Dịch vụ email hóa đơn chưa được cấu hình.");
        String total = NumberFormat.getCurrencyInstance(Locale.of("vi", "VN")).format(amount);
        String code = HtmlUtils.htmlEscape(invoiceCode);
        try {
            var message = sender.createMimeMessage();
            var helper = new MimeMessageHelper(message, true, StandardCharsets.UTF_8.name());
            helper.setValidateAddresses(true);
            helper.setFrom(username, "M4N");
            helper.setTo(email);
            helper.setSubject("M4N — Hóa đơn mua hàng " + invoiceCode);
            helper.setText("Cảm ơn quý khách đã mua hàng tại M4N.\nMã hóa đơn: " + invoiceCode
                    + "\nĐã thanh toán: " + total + "\nPhương thức: Thẻ qua MoMo."
                    + "\nHóa đơn PDF được đính kèm email này. Vui lòng lưu mã hóa đơn khi cần hỗ trợ.",
                    """
                    <!doctype html><html lang="vi"><body style="margin:0;padding:24px;background:#F6F7F8;color:#17191B;font-family:Arial,sans-serif">
                    <div style="max-width:560px;margin:auto;background:#FFFFFF;border:1px solid #E3E6E8;border-top:4px solid #A62F25;padding:28px">
                    <p style="font-size:28px;font-weight:bold;color:#A62F25;margin:0">M4N</p>
                    <h1 style="font-size:24px;margin-top:24px">Cảm ơn quý khách đã mua hàng</h1>
                    <p style="line-height:1.7">Giao dịch tại quầy đã hoàn tất. Hóa đơn PDF được đính kèm để quý khách lưu và đối chiếu khi cần hỗ trợ.</p>
                    <div style="padding:20px;background:#F6F7F8;line-height:1.8">Mã hóa đơn: <strong>%s</strong><br>
                    Đã thanh toán: <strong>%s</strong><br>Phương thức: Thẻ qua MoMo</div>
                    <p style="font-size:12px;line-height:1.7;color:#5F646A;margin-top:24px">Đây là email tự động từ M4N — Nhạc cụ truyền thống Việt Nam.</p>
                    </div></body></html>
                    """.formatted(code, HtmlUtils.htmlEscape(total)));
            helper.addAttachment("M4N-" + invoiceCode.replaceAll("[^A-Za-z0-9_-]", "_") + ".pdf",
                    new ByteArrayResource(pdf), "application/pdf");
            sender.send(message);
        } catch (MailException | MessagingException | UnsupportedEncodingException ex) {
            throw new IllegalStateException("Chưa gửi được email hóa đơn. Hệ thống sẽ thử lại.");
        }
    }
}
