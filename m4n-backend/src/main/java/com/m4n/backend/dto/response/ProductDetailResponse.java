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
        Integer stockQuantity,
        Integer lowStockThreshold,
        BigDecimal originalPrice,
        BigDecimal productDiscountAmount,
        Long productPromotionId,
        String variantGroup,
        String variantLabel,
        Long familyId,
        String familyName,
        String option1Name,
        String option2Name,
        String option1Value,
        String option2Value
) {
    public ProductDetailResponse(
            Long id, String code, String name, BigDecimal price, String priceDisplay,
            String description, CategorySummaryResponse category, String material,
            String dimensions, String musicalRange, String origin, ArtisanSummaryResponse artisan,
            CraftVillageSummaryResponse craftVillage, List<ProductMediaResponse> media,
            String availability, Integer stockQuantity, Integer lowStockThreshold,
            BigDecimal originalPrice, BigDecimal productDiscountAmount, Long productPromotionId,
            String variantGroup, String variantLabel, Long familyId, String familyName
    ) {
        this(id, code, name, price, priceDisplay, description, category, material, dimensions,
                musicalRange, origin, artisan, craftVillage, media, availability, stockQuantity,
                lowStockThreshold, originalPrice, productDiscountAmount, productPromotionId,
                variantGroup, variantLabel, familyId, familyName, null, null, null, null);
    }
}
