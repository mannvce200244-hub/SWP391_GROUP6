package com.m4n.backend.controller;

import com.m4n.backend.dto.request.PosSalePreviewRequest;
import com.m4n.backend.dto.request.PosSaleRequest;
import com.m4n.backend.dto.response.PosProductResponse;
import com.m4n.backend.dto.response.PosSalePreviewResponse;
import com.m4n.backend.dto.response.PosSaleResponse;
import com.m4n.backend.service.PosService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/pos")
@RequiredArgsConstructor
@Tag(name = "POS Showroom", description = "Showroom point of sale operations and in-store checkout")
public class PosController {

    private final PosService posService;
    private final com.m4n.backend.service.InvoicePdfService invoicePdfService;

    @GetMapping("/products/search")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'POS_STAFF', 'ADMIN')")
    @Operation(summary = "Search products for POS bill", description = "Searches active products by name, code, or barcode with current showroom inventory.")
    public ResponseEntity<List<PosProductResponse>> searchProducts(@RequestParam(required = false) String q) {
        return ResponseEntity.ok(posService.searchProducts(q));
    }

    @GetMapping("/products/barcode/{barcode}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'POS_STAFF', 'ADMIN')")
    @Operation(summary = "Lookup product by barcode or code", description = "Resolves scanned barcode or typed product code to a product.")
    public ResponseEntity<PosProductResponse> lookupBarcode(@PathVariable String barcode) {
        return ResponseEntity.ok(posService.lookupBarcode(barcode));
    }

    @PostMapping("/checkout/preview")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'POS_STAFF', 'ADMIN')")
    @Operation(summary = "Preview POS bill and calculate totals", description = "Calculates authoritative subtotal, voucher discount, final amount, and stock availability.")
    public ResponseEntity<PosSalePreviewResponse> previewSale(@Valid @RequestBody PosSalePreviewRequest request) {
        return ResponseEntity.ok(posService.previewSale(request));
    }

    @PostMapping("/sales")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'POS_STAFF', 'ADMIN')")
    @Operation(summary = "Finalize POS sale and deduct inventory", description = "Atomically verifies stock, deducts inventory, creates Invoice, and records the sale.")
    public ResponseEntity<PosSaleResponse> finalizeSale(@Valid @RequestBody PosSaleRequest request) {
        return ResponseEntity.ok(posService.finalizeSale(request));
    }

    @GetMapping("/invoices/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'POS_STAFF', 'ADMIN')")
    @Operation(summary = "Get POS invoice detail", description = "Returns persisted invoice details for a finalized POS transaction.")
    public ResponseEntity<PosSaleResponse> getInvoice(@PathVariable Long id) {
        return ResponseEntity.ok(posService.getInvoiceById(id));
    }

    @GetMapping("/invoices/{id}/pdf")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'POS_STAFF', 'ADMIN')")
    @Operation(summary = "Download POS invoice PDF", description = "Generates and streams authoritative PDF invoice receipt.")
    public ResponseEntity<byte[]> getInvoicePdf(@PathVariable Long id) {
        byte[] pdfBytes = invoicePdfService.generateInvoicePdf(id);
        return ResponseEntity.ok()
                .contentType(org.springframework.http.MediaType.APPLICATION_PDF)
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"Invoice-" + id + ".pdf\"")
                .body(pdfBytes);
    }
}
