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
        Instant updatedAt,
        Integer lowStockThreshold,
        BigDecimal billableWeightKg,
        BigDecimal bulkySurcharge,
        String variantGroup,
        String variantLabel,
        Long familyId,
        String familyName,
        String option1Name,
        String option2Name,
        String option1Value,
        String option2Value
) {
    public AdminProductDetailResponse(
            Long id, String code, String barcode, String name, BigDecimal price,
            String priceDisplay, String description, CategorySummaryResponse category,
            String material, String dimensions, String musicalRange, String origin,
            ArtisanSummaryResponse artisan, CraftVillageSummaryResponse craftVillage,
            List<ProductMediaResponse> media, boolean isActive, Integer stockQuantity,
            String availability, Instant createdAt, Instant updatedAt, Integer lowStockThreshold,
            BigDecimal billableWeightKg, BigDecimal bulkySurcharge, String variantGroup,
            String variantLabel, Long familyId, String familyName
    ) {
        this(id, code, barcode, name, price, priceDisplay, description, category, material,
                dimensions, musicalRange, origin, artisan, craftVillage, media, isActive,
                stockQuantity, availability, createdAt, updatedAt, lowStockThreshold,
                billableWeightKg, bulkySurcharge, variantGroup, variantLabel, familyId, familyName,
                null, null, null, null);
    }
}
