package com.m4n.backend.serviceImpl;

import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.BaseFont;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.lowagie.text.pdf.draw.LineSeparator;
import com.m4n.backend.entity.Invoice;
import com.m4n.backend.entity.InvoiceItem;
import com.m4n.backend.exception.ResourceNotFoundException;
import com.m4n.backend.repository.InvoiceRepository;
import com.m4n.backend.service.InvoicePdfService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Slf4j
@Service
@RequiredArgsConstructor
public class InvoicePdfServiceImpl implements InvoicePdfService {

    private static final Locale VN_LOCALE = Locale.of("vi", "VN");
    private static final ZoneId VN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm").withZone(VN_ZONE);

    private final InvoiceRepository invoiceRepository;

    @Override
    @Transactional(readOnly = true)
    public byte[] generateInvoicePdf(Long invoiceId) {
        Invoice invoice = invoiceRepository.findWithDetailsById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hóa đơn với ID: " + invoiceId));

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A5, 24, 24, 24, 24);

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            // Setup fonts with Unicode support for Vietnamese
            BaseFont baseFont = resolveUnicodeFont();
            Font brandFont = new Font(baseFont, 14, Font.BOLD, new Color(18, 53, 36)); // Deep Jade
            Font subBrandFont = new Font(baseFont, 8, Font.NORMAL, new Color(100, 116, 139));
            Font titleFont = new Font(baseFont, 13, Font.BOLD, new Color(17, 24, 39));
            Font subTitleFont = new Font(baseFont, 8, Font.ITALIC, new Color(107, 114, 128));
            Font headerCellFont = new Font(baseFont, 8, Font.BOLD, Color.WHITE);
            Font bodyFont = new Font(baseFont, 8, Font.NORMAL, new Color(31, 41, 55));
            Font bodyBoldFont = new Font(baseFont, 8, Font.BOLD, new Color(17, 24, 39));
            Font totalFont = new Font(baseFont, 11, Font.BOLD, new Color(18, 53, 36));
            Font footerFont = new Font(baseFont, 7.5f, Font.ITALIC, new Color(107, 114, 128));

            // 1. Store Header
            Paragraph brandName = new Paragraph("M4N – NHẠC CỤ TRUYỀN THỐNG VIỆT NAM", brandFont);
            brandName.setAlignment(Element.ALIGN_CENTER);
            document.add(brandName);

            Paragraph brandInfo = new Paragraph("Showroom: 150 Đường Lê Lợi, Bến Thành, Quận 1, TP. Hồ Chí Minh\nHotline: 0900.000.003  ·  Website: https://m4n.vn", subBrandFont);
            brandInfo.setAlignment(Element.ALIGN_CENTER);
            brandInfo.setSpacingAfter(8);
            document.add(brandInfo);

            LineSeparator sep = new LineSeparator(0.5f, 100, new Color(226, 232, 240), Element.ALIGN_CENTER, -2);
            document.add(sep);

            // 2. Receipt Title
            Paragraph title = new Paragraph("HÓA ĐƠN BÁN HÀNG", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingBefore(6);
            document.add(title);

            Paragraph subTitle = new Paragraph("(Bán lẻ trực tiếp tại quầy Showroom M4N)", subTitleFont);
            subTitle.setAlignment(Element.ALIGN_CENTER);
            subTitle.setSpacingAfter(8);
            document.add(subTitle);

            // 3. Invoice Metadata Table (2-column layout)
            PdfPTable metaTable = new PdfPTable(2);
            metaTable.setWidthPercentage(100);
            metaTable.setWidths(new float[]{50, 50});
            metaTable.setSpacingAfter(10);

            String timeStr = invoice.getCreatedAt() != null ? DATE_FORMATTER.format(invoice.getCreatedAt()) : "—";
            String staffStr = invoice.getStaff() != null ? invoice.getStaff().getFullName() : "Nhân viên Showroom POS";

            addMetaCell(metaTable, "Mã hóa đơn: " + invoice.getInvoiceCode(), bodyBoldFont, Element.ALIGN_LEFT);
            addMetaCell(metaTable, "Thời gian: " + timeStr, bodyFont, Element.ALIGN_RIGHT);
            addMetaCell(metaTable, "Thu ngân: " + staffStr, bodyFont, Element.ALIGN_LEFT);
            addMetaCell(metaTable, "Khách hàng: " + (invoice.getCustomerName() != null ? invoice.getCustomerName() : "Khách lẻ tại quầy"), bodyFont, Element.ALIGN_RIGHT);
            addMetaCell(metaTable, "Phương thức: " + ("CASH".equals(invoice.getPaymentMethod()) ? "Tiền mặt tại quầy" : "Chuyển khoản QR"), bodyFont, Element.ALIGN_LEFT);
            if (invoice.getCustomerPhone() != null && !invoice.getCustomerPhone().isBlank()) {
                addMetaCell(metaTable, "SĐT khách: " + invoice.getCustomerPhone(), bodyFont, Element.ALIGN_RIGHT);
            } else {
                addMetaCell(metaTable, "", bodyFont, Element.ALIGN_RIGHT);
            }

            document.add(metaTable);

            // 4. Products Table
            PdfPTable table = new PdfPTable(4);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{48, 12, 20, 20});
            table.setSpacingAfter(10);

            // Header row
            addTableHeader(table, "Tên nhạc cụ / Mã", headerCellFont, Element.ALIGN_LEFT);
            addTableHeader(table, "SL", headerCellFont, Element.ALIGN_CENTER);
            addTableHeader(table, "Đơn giá", headerCellFont, Element.ALIGN_RIGHT);
            addTableHeader(table, "Thành tiền", headerCellFont, Element.ALIGN_RIGHT);

            // Item rows
            boolean alternate = false;
            Color altColor = new Color(248, 250, 252);
            for (InvoiceItem item : invoice.getItems()) {
                Color rowBg = alternate ? altColor : Color.WHITE;
                alternate = !alternate;

                String productDesc = item.getProductName() + "\n(" + item.getProductCode() + ")";
                addTableCell(table, productDesc, bodyFont, Element.ALIGN_LEFT, rowBg);
                addTableCell(table, String.valueOf(item.getQuantity()), bodyFont, Element.ALIGN_CENTER, rowBg);
                addTableCell(table, formatVnd(item.getUnitPrice()), bodyFont, Element.ALIGN_RIGHT, rowBg);
                addTableCell(table, formatVnd(item.getLineAmount()), bodyBoldFont, Element.ALIGN_RIGHT, rowBg);
            }

            document.add(table);

            // 5. Totals & Payment Summary Table
            PdfPTable summaryTable = new PdfPTable(2);
            summaryTable.setWidthPercentage(100);
            summaryTable.setWidths(new float[]{65, 35});
            summaryTable.setSpacingAfter(12);

            addSummaryRow(summaryTable, "Tạm tính:", formatVnd(invoice.getSubtotal()), bodyFont, false);

            if (invoice.getDiscount() != null && invoice.getDiscount().compareTo(BigDecimal.ZERO) > 0) {
                String voucherLabel = invoice.getVoucherCode() != null
                        ? "Giảm giá (Voucher " + invoice.getVoucherCode() + "):"
                        : "Giảm giá:";
                addSummaryRow(summaryTable, voucherLabel, "-" + formatVnd(invoice.getDiscount()), bodyFont, false);
            }

            addSummaryRow(summaryTable, "TỔNG CỘNG THANH TOÁN:", formatVnd(invoice.getFinalAmount()), totalFont, true);

            if ("CASH".equals(invoice.getPaymentMethod()) && invoice.getAmountReceived() != null) {
                addSummaryRow(summaryTable, "Tiền khách đưa:", formatVnd(invoice.getAmountReceived()), bodyFont, false);
                BigDecimal change = invoice.getAmountChange() != null ? invoice.getAmountChange() : BigDecimal.ZERO;
                addSummaryRow(summaryTable, "Tiền thừa trả khách:", formatVnd(change), bodyBoldFont, false);
            }

            document.add(summaryTable);

            // 6. Footer Note
            Paragraph footer = new Paragraph(
                    "Cảm ơn quý khách đã tin tưởng và đồng hành cùng M4N!\n" +
                    "Nhạc cụ thủ công truyền thống được bảo hành 12 tháng tại hệ thống Showroom M4N.\n" +
                    "Hóa đơn này có giá trị xác nhận mua hàng và kích hoạt bảo hành.",
                    footerFont
            );
            footer.setAlignment(Element.ALIGN_CENTER);
            footer.setSpacingBefore(10);
            document.add(footer);

            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            log.error("Failed to generate PDF for invoice ID: {}", invoiceId, e);
            throw new RuntimeException("Không thể tạo hóa đơn PDF: " + e.getMessage(), e);
        }
    }

    private void addMetaCell(PdfPTable table, String text, Font font, int alignment) {
        PdfPCell cell = new PdfPCell(new Paragraph(text, font));
        cell.setBorder(Rectangle.NO_BORDER);
        cell.setHorizontalAlignment(alignment);
        cell.setPaddingBottom(3);
        table.addCell(cell);
    }

    private void addTableHeader(PdfPTable table, String title, Font font, int alignment) {
        PdfPCell cell = new PdfPCell(new Paragraph(title, font));
        cell.setBackgroundColor(new Color(18, 53, 36)); // Deep Jade
        cell.setHorizontalAlignment(alignment);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        cell.setPaddingTop(5);
        cell.setPaddingBottom(5);
        cell.setPaddingLeft(6);
        cell.setPaddingRight(6);
        cell.setBorderColor(new Color(15, 45, 30));
        table.addCell(cell);
    }

    private void addTableCell(PdfPTable table, String text, Font font, int alignment, Color bgColor) {
        PdfPCell cell = new PdfPCell(new Paragraph(text, font));
        cell.setBackgroundColor(bgColor);
        cell.setHorizontalAlignment(alignment);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        cell.setPaddingTop(5);
        cell.setPaddingBottom(5);
        cell.setPaddingLeft(6);
        cell.setPaddingRight(6);
        cell.setBorderColor(new Color(226, 232, 240));
        table.addCell(cell);
    }

    private void addSummaryRow(PdfPTable table, String label, String value, Font font, boolean isTotal) {
        PdfPCell labelCell = new PdfPCell(new Paragraph(label, font));
        labelCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        labelCell.setBorder(Rectangle.NO_BORDER);
        labelCell.setPaddingTop(isTotal ? 6 : 2);
        labelCell.setPaddingBottom(isTotal ? 6 : 2);
        labelCell.setPaddingRight(10);
        if (isTotal) {
            labelCell.setBackgroundColor(new Color(240, 247, 243));
        }

        PdfPCell valueCell = new PdfPCell(new Paragraph(value, font));
        valueCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        valueCell.setBorder(Rectangle.NO_BORDER);
        valueCell.setPaddingTop(isTotal ? 6 : 2);
        valueCell.setPaddingBottom(isTotal ? 6 : 2);
        valueCell.setPaddingRight(6);
        if (isTotal) {
            valueCell.setBackgroundColor(new Color(240, 247, 243));
        }

        table.addCell(labelCell);
        table.addCell(valueCell);
    }

    private BaseFont resolveUnicodeFont() {
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
                } catch (Exception e) {
                    log.debug("Could not load font from {}: {}", path, e.getMessage());
                }
            }
        }

        // Fallback to built-in Helvetica if system font is not available
        try {
            return BaseFont.createFont(BaseFont.HELVETICA, BaseFont.WINANSI, BaseFont.NOT_EMBEDDED);
        } catch (Exception e) {
            throw new RuntimeException("Could not initialize default PDF font", e);
        }
    }

    private String formatVnd(BigDecimal amount) {
        if (amount == null) return "0 ₫";
        NumberFormat nf = NumberFormat.getInstance(VN_LOCALE);
        return nf.format(amount) + " ₫";
    }
}
