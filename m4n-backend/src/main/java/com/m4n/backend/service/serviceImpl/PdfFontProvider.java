package com.m4n.backend.service.serviceImpl;

import com.lowagie.text.DocumentException;
import com.lowagie.text.pdf.BaseFont;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import java.io.File;

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
        // Try common system fonts supporting Vietnamese Unicode
        String[] candidateFontPaths = {
                "C:/Windows/Fonts/arial.ttf",
                "C:/Windows/Fonts/tahoma.ttf",
                "C:/Windows/Fonts/segoeui.ttf",
                "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
                "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"
        };

        for (String path : candidateFontPaths) {
            File fontFile = new File(path);
            if (fontFile.exists() && fontFile.canRead()) {
                try {
                    return BaseFont.createFont(path, BaseFont.IDENTITY_H, BaseFont.EMBEDDED);
                } catch (java.io.IOException | DocumentException e) {
                    log.debug("System invoice Unicode font could not be loaded.");
                }
            }
        }

        throw new IllegalStateException("Phông chữ tiếng Việt cho hóa đơn chưa sẵn sàng. Vui lòng liên hệ quản trị viên.");
    }

}
