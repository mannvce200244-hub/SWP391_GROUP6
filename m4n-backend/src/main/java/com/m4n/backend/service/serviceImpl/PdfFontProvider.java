package com.m4n.backend.service.serviceImpl;

import com.lowagie.text.DocumentException;
import com.lowagie.text.pdf.BaseFont;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import java.io.IOException;

@Slf4j
@Component
public class PdfFontProvider {
    private final String configuredFontPath;

    public PdfFontProvider(@Value("${m4n.pdf.font-path:}") String configuredFontPath) {
        this.configuredFontPath = configuredFontPath.trim();
    }

    public BaseFont resolve() {
        if (!configuredFontPath.isBlank()) {
            try {
                return BaseFont.createFont(configuredFontPath, BaseFont.IDENTITY_H, BaseFont.EMBEDDED);
            } catch (java.io.IOException | DocumentException e) {
                log.error("Configured invoice Unicode font could not be loaded.");
                throw new IllegalStateException("Phông chữ hóa đơn chưa sẵn sàng. Vui lòng liên hệ quản trị viên.", e);
            }
        }
        // Railway images may contain no system fonts; load the licensed font from the JAR.
        try (var stream = PdfFontProvider.class.getResourceAsStream("/fonts/BeVietnamPro-Regular.ttf")) {
            if (stream == null) throw new IOException("Bundled invoice font is missing.");
            return BaseFont.createFont("BeVietnamPro-Regular.ttf", BaseFont.IDENTITY_H,
                    BaseFont.EMBEDDED, true, stream.readAllBytes(), null);
        } catch (IOException | DocumentException e) {
            throw new IllegalStateException("Phông chữ tiếng Việt cho hóa đơn chưa sẵn sàng. Vui lòng liên hệ quản trị viên.", e);
        }
    }

}
