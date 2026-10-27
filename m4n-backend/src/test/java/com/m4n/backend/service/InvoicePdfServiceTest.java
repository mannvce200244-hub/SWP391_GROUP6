package com.m4n.backend.service;

import com.m4n.backend.entity.Category;
import com.m4n.backend.entity.Invoice;
import com.m4n.backend.entity.InvoiceItem;
import com.m4n.backend.entity.Product;
import com.m4n.backend.entity.Role;
import com.m4n.backend.entity.RoleName;
import com.m4n.backend.entity.User;
import com.m4n.backend.repository.InvoiceRepository;
import com.m4n.backend.service.serviceImpl.InvoicePdfServiceImpl;
import com.lowagie.text.pdf.PdfReader;
import com.lowagie.text.pdf.parser.PdfTextExtractor;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Optional;
import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InvoicePdfServiceTest {

    @Mock
    private InvoiceRepository invoiceRepository;

    private InvoicePdfService invoicePdfService;

    private Invoice sampleInvoice;

    @BeforeEach
    void setUp() {
        invoicePdfService = new InvoicePdfServiceImpl(invoiceRepository, "");

        Role staffRole = Role.builder().id(3L).name(RoleName.POS_STAFF).build();
        User staff = User.builder().id(5L).fullName("Nguyễn Thu Ngân").role(staffRole).build();

        Category category = Category.builder().id(1L).name("Nhạc cụ dây").build();
        Product productA = Product.builder().id(1L).name("Đàn Bầu Gỗ Mun").code("BAU-001").price(new BigDecimal("6200000")).category(category).build();
        Product productB = Product.builder().id(2L).name("Sáo Trúc Tone Đô").code("SAO-001").price(new BigDecimal("1250000")).category(category).build();

        sampleInvoice = Invoice.builder()
                .id(100L)
                .invoiceCode("HD-2026-123456")
                .staff(staff)
                .customerName("Trần Khách Mua")
                .customerPhone("0987654321")
                .subtotal(new BigDecimal("7450000"))
                .discount(new BigDecimal("745000"))
                .finalAmount(new BigDecimal("6705000"))
                .voucherCode("M4N10")
                .paymentMethod("CASH")
                .amountReceived(new BigDecimal("7000000"))
                .amountChange(new BigDecimal("295000"))
                .createdAt(Instant.now())
                .items(new ArrayList<>())
                .build();

        InvoiceItem item1 = InvoiceItem.builder()
                .id(1L)
                .invoice(sampleInvoice)
                .product(productA)
                .productName("Đàn Bầu Gỗ Mun Thân Liền")
                .productCode("BAU-001")
                .unitPrice(new BigDecimal("6200000"))
                .quantity(1)
                .lineAmount(new BigDecimal("6200000"))
                .build();

        InvoiceItem item2 = InvoiceItem.builder()
                .id(2L)
                .invoice(sampleInvoice)
                .product(productB)
                .productName("Sáo Trúc Tone Đô (C5) Trúc Già")
                .productCode("SAO-001")
                .unitPrice(new BigDecimal("1250000"))
                .quantity(1)
                .lineAmount(new BigDecimal("1250000"))
                .build();

        sampleInvoice.getItems().add(item1);
        sampleInvoice.getItems().add(item2);
    }

    @Test
    void configuredMissingFontRejectsExportInsteadOfProducingCorruptedVietnamese() {
        when(invoiceRepository.findWithDetailsById(100L)).thenReturn(Optional.of(sampleInvoice));
        var service = new InvoicePdfServiceImpl(invoiceRepository,
                java.nio.file.Path.of(System.getProperty("java.io.tmpdir"), "m4n-missing-" + java.util.UUID.randomUUID() + ".ttf").toString());
        assertThatThrownBy(() -> service.generateInvoicePdf(100L)).isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Phông chữ hóa đơn chưa sẵn sàng");
    }

    @Test
    @DisplayName("generateInvoicePdf should produce valid PDF byte stream with Vietnamese headers and items")
    void shouldGenerateValidPdfBytes() throws Exception {
        when(invoiceRepository.findWithDetailsById(100L)).thenReturn(Optional.of(sampleInvoice));

        byte[] pdfBytes = invoicePdfService.generateInvoicePdf(100L);

        assertThat(pdfBytes).isNotNull();
        assertThat(pdfBytes.length).isGreaterThan(1000);

        // Verify PDF Header Magic Bytes: %PDF
        String header = new String(pdfBytes, 0, 4, StandardCharsets.US_ASCII);
        assertThat(header).isEqualTo("%PDF");

        try (PdfReader reader = new PdfReader(pdfBytes)) {
            PdfTextExtractor extractor = new PdfTextExtractor(reader);
            StringBuilder content = new StringBuilder();
            for (int page = 1; page <= reader.getNumberOfPages(); page++) {
                content.append(extractor.getTextFromPage(page));
            }
            assertThat(content.toString()).contains("HD-2026-123456", "Nguyễn Thu Ngân", "Trần Khách Mua",
                    "0987654321", "BAU-001", "SAO-001", "Đàn Bầu Gỗ Mun Thân Liền", "Tiền thừa trả khách");
            assertThat(content.toString().split("BAU-001", -1)).hasSize(2);
        }
    }
}
