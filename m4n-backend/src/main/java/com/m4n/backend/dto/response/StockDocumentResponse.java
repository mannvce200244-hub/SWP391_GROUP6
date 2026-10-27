package com.m4n.backend.dto.response;

import com.m4n.backend.entity.StockDocumentType;
import com.m4n.backend.entity.StockDocumentStatus;
import java.time.Instant;

public record StockDocumentResponse(Long id, Long productId, String productCode, String productName,
        StockDocumentType type, StockDocumentStatus status, Integer quantity, String reason,
        String createdBy, Instant createdAt, String confirmedBy, Instant confirmedAt,
        Integer acceptedQuantity, Integer rejectedQuantity, String rejectionReason,
        Integer quantityBefore, Integer quantityAfter) {}
