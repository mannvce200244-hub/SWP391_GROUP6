package com.m4n.backend.dto.response;

import com.m4n.backend.entity.PromotionType;

import java.math.BigDecimal;
import java.time.Instant;

public record VoucherResponse(
        Long id,
        String code,
        BigDecimal discountRate,
        BigDecimal minimumOrderValue,
        boolean isActive,
        String description,
        Instant validFrom,
        Instant validUntil,
        Integer usageLimit,
        Integer usedCount,
        Instant createdAt,
        Instant updatedAt,
        PromotionType promotionType,
        Integer minimumQuantity,
        BigDecimal fixedDiscountAmount
) {
}
