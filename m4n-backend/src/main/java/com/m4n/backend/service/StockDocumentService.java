package com.m4n.backend.service;

import com.m4n.backend.dto.request.ConfirmStockDocumentRequest;
import com.m4n.backend.dto.request.StockImportRequest;
import com.m4n.backend.dto.request.StockIssueRequest;
import com.m4n.backend.dto.response.StockDocumentResponse;
import com.m4n.backend.entity.StockDocumentStatus;
import com.m4n.backend.entity.StockDocumentType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface StockDocumentService {
    StockDocumentResponse createReceipt(Long productId, StockImportRequest request);
    StockDocumentResponse createIssue(Long productId, StockIssueRequest request);
    StockDocumentResponse confirm(Long documentId, ConfirmStockDocumentRequest request);
    Page<StockDocumentResponse> list(Long productId, StockDocumentType type, StockDocumentStatus status, Pageable pageable);
}
