package com.m4n.backend.dto.response;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record AdminProductDetailResponse(
        Long id,
        String code,
        String barcode,
        String name,
        BigDecimal price,
        String priceDisplay,
        String description,
        CategorySummaryResponse category,
        String material,
        String dimensions,
        String musicalRange,
        String origin,
        ArtisanSummaryResponse artisan,
        CraftVillageSummaryResponse craftVillage,
        List<ProductMediaResponse> media,
        boolean isActive,
        Integer stockQuantity,
        String availability,
        Instant createdAt,
        Instant updatedAt
) {}
