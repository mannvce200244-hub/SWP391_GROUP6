package com.m4n.backend.service;

import com.m4n.backend.dto.request.PosSalePreviewRequest;
import com.m4n.backend.dto.request.PosSaleRequest;
import com.m4n.backend.dto.response.PosProductResponse;
import com.m4n.backend.dto.response.PosSalePreviewResponse;
import com.m4n.backend.dto.response.PosSaleResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface PosService {

    List<PosProductResponse> searchProducts(String keyword);

    PosProductResponse lookupBarcode(String codeOrBarcode);

    PosSalePreviewResponse previewSale(PosSalePreviewRequest request);

    PosSaleResponse finalizeSale(PosSaleRequest request);

    /** Internal settlement: loads a persisted, provider-verified POS intent, never client payment flags. */
    void completeMomoSale(String paymentId);

    PosSaleResponse getInvoiceById(Long invoiceId, String actorEmail);

    void assertCanAccessInvoice(Long invoiceId, String actorEmail);

    Page<PosSaleResponse> listInvoices(String search, Pageable pageable, String actorEmail);
}
