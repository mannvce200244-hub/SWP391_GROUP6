package com.m4n.backend.dto.response;

import java.math.BigDecimal;
import java.time.Instant;

public record ProductPromotionResponse(Long id, Long productId, String productName, String name,
        BigDecimal discountRate, boolean isActive, Instant validFrom, Instant validUntil, Long version,
        Instant createdAt, Instant updatedAt) {}
