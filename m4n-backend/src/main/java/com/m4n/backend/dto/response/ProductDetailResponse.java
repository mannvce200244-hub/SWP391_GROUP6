package com.m4n.backend.dto.response;

import java.math.BigDecimal;
import java.util.List;

public record ProductDetailResponse(
        Long id,
        String code,
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
        String availability,
        Integer stockQuantity
) {}
