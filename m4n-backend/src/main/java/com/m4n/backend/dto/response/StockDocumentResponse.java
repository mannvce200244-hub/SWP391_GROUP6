package com.m4n.backend.dto.response;

import com.m4n.backend.entity.StockDocumentType;
import com.m4n.backend.entity.StockDocumentStatus;
import java.time.Instant;
import java.math.BigDecimal;
import com.fasterxml.jackson.annotation.JsonFormat;

public record StockDocumentResponse(Long id, Long productId, String productCode, String productName,
        StockDocumentType type, StockDocumentStatus status, Integer quantity, String reason,
        String createdBy, Instant createdAt, String confirmedBy, Instant confirmedAt,
        Integer acceptedQuantity, Integer rejectedQuantity, String rejectionReason,
        Integer quantityBefore, Integer quantityAfter,
        @JsonFormat(shape = JsonFormat.Shape.STRING) BigDecimal unitCost,
        @JsonFormat(shape = JsonFormat.Shape.STRING) BigDecimal estimatedAmount,
        @JsonFormat(shape = JsonFormat.Shape.STRING) BigDecimal receivedAmount) {}
