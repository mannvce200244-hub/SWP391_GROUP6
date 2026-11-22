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
        long variantCount
) {}
