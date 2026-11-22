package com.m4n.backend.dto.response;

import java.math.BigDecimal;
import java.time.Instant;

public record AdminProductSummaryResponse(
        Long id,
        String code,
        String barcode,
        String name,
        BigDecimal price,
        String priceDisplay,
        CategorySummaryResponse category,
        ArtisanSummaryResponse artisan,
        CraftVillageSummaryResponse craftVillage,
        String primaryImage,
        Long stockQuantity,
        String availability,
        boolean isActive,
        Instant createdAt,
        Instant updatedAt,
        Long familyId,
        String familyName,
        long variantCount
) {}
