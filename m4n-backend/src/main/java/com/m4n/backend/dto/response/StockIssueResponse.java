package com.m4n.backend.dto.response;

import java.time.Instant;

public record StockIssueResponse(
        Long productId,
        String productCode,
        String productName,
        int previousQuantity,
        int issuedQuantity,
        int newQuantity,
        String message,
        Instant updatedAt
) {}
