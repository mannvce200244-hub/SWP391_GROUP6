package com.m4n.backend.dto.response;

import java.math.BigDecimal;
import java.util.List;

public record ProductSummaryResponse(
        Long id,
        String code,
        String name,
        BigDecimal price,
        String priceDisplay,
        String groupName,
        String artisanName,
        String craftVillageName,
        List<ProductMediaResponse> media,
        String availability,
        BigDecimal originalPrice,
        BigDecimal productDiscountAmount,
        Long productPromotionId,
        Long stockQuantity,
        String variantGroup,
        String variantLabel,
        Long familyId,
        String familyName,
        long variantCount,
        String option1Name,
        String option2Name,
        String option1Value,
        String option2Value
) {
    public ProductSummaryResponse(
            Long id, String code, String name, BigDecimal price, String priceDisplay,
            String groupName, String artisanName, String craftVillageName,
            List<ProductMediaResponse> media, String availability, BigDecimal originalPrice,
            BigDecimal productDiscountAmount, Long productPromotionId, Long stockQuantity,
            String variantGroup, String variantLabel, Long familyId, String familyName, long variantCount
    ) {
        this(id, code, name, price, priceDisplay, groupName, artisanName, craftVillageName,
                media, availability, originalPrice, productDiscountAmount, productPromotionId,
                stockQuantity, variantGroup, variantLabel, familyId, familyName, variantCount,
                null, null, null, null);
    }
}
