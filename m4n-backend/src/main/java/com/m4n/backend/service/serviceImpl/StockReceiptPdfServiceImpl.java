package com.m4n.backend.service.serviceImpl;

import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.m4n.backend.service.StockDocumentService;
import com.m4n.backend.service.StockReceiptPdfService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
public class StockReceiptPdfServiceImpl implements StockReceiptPdfService {
    private final StockDocumentService documents;
    private final PdfFontProvider fonts;
    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")
            .withZone(ZoneId.of("Asia/Ho_Chi_Minh"));

    @Override
    public byte[] generateReceiptPdf(Long documentId) {
        var receipt = documents.getConfirmedReceipt(documentId);
        var output = new ByteArrayOutputStream();
        var document = new Document(PageSize.A4, 40, 40, 40, 40);
        try {
            var baseFont = fonts.resolve();
            var body = new Font(baseFont, 10);
            var bold = new Font(baseFont, 11, Font.BOLD);
            PdfWriter.getInstance(document, output);
            document.open();
            var title = new Paragraph("M4N — PHIẾU NHẬP KHO #" + receipt.id(), new Font(baseFont, 17, Font.BOLD));
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(24);
            document.add(title);
            document.add(new Paragraph("Ngày lập: " + DATE.format(receipt.createdAt()), body));
            document.add(new Paragraph("Người lập: " + receipt.createdBy(), body));
            document.add(new Paragraph("Xác nhận: " + DATE.format(receipt.confirmedAt()) + " · " + receipt.confirmedBy(), body));
            var table = new PdfPTable(new float[]{3, 2});
            table.setWidthPercentage(100);
            table.setSpacingBefore(20);
            row(table, "Sản phẩm", receipt.productName(), body);
            row(table, "Mã sản phẩm", receipt.productCode(), body);
            row(table, "Số lượng trên phiếu", String.valueOf(receipt.quantity()), body);
            row(table, "Thực nhập (đạt QC)", String.valueOf(receipt.acceptedQuantity()), body);
            row(table, "Bị loại", String.valueOf(receipt.rejectedQuantity()), body);
            row(table, "Đơn giá nhập", money(receipt.unitCost()), body);
            row(table, "Thành tiền thực nhập", money(receipt.receivedAmount()), bold);
            row(table, "Tồn kho trước → sau", receipt.quantityBefore() + " → " + receipt.quantityAfter(), body);
            document.add(table);
            if (receipt.reason() != null) document.add(new Paragraph("Ghi chú: " + receipt.reason(), body));
            if (receipt.rejectedQuantity() > 0) document.add(new Paragraph("Lý do loại: " + receipt.rejectionReason(), body));
            document.close();
            return output.toByteArray();
        } catch (DocumentException exception) {
            throw new IllegalStateException("Không thể tạo phiếu nhập PDF. Vui lòng thử lại.", exception);
        } finally {
            if (document.isOpen()) document.close();
        }
    }

    private static void row(PdfPTable table, String label, String value, Font font) {
        for (String text : new String[]{label, value}) {
            var cell = new PdfPCell(new Paragraph(text, font));
            cell.setPadding(10);
            cell.setBorderColor(new Color(227, 230, 232));
            table.addCell(cell);
        }
    }

    private static String money(BigDecimal amount) {
        if (amount == null) return "Chưa ghi nhận";
        return NumberFormat.getNumberInstance(Locale.of("vi", "VN")).format(amount) + " ₫";
    }
}
