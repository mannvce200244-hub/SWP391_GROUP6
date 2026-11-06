package com.m4n.backend.dto.response;

import java.time.Instant;

public record InventoryMovementResponse(Long id, Long productId, String productCode, String productName,
        String type, Integer quantity, Integer quantityBefore, Integer quantityAfter, Integer rejectedQuantity,
        String rejectionReason, String reason, String actorEmail, Instant createdAt, String sourceType, Long sourceId) {}
