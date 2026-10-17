package com.m4n.backend.service;

import com.m4n.backend.dto.request.PosSalePreviewRequest;
import com.m4n.backend.dto.request.PosSaleRequest;
import com.m4n.backend.dto.response.PosProductResponse;
import com.m4n.backend.dto.response.PosSalePreviewResponse;
import com.m4n.backend.dto.response.PosSaleResponse;

import java.util.List;

public interface PosService {

    List<PosProductResponse> searchProducts(String keyword);

    PosProductResponse lookupBarcode(String codeOrBarcode);

    PosSalePreviewResponse previewSale(PosSalePreviewRequest request);

    PosSaleResponse finalizeSale(PosSaleRequest request);

    PosSaleResponse getInvoiceById(Long invoiceId);
}
