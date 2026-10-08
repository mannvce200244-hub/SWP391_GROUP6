package com.m4n.backend.dto.response;

import java.math.BigDecimal;

public record OrderItemResponse(
        Long id,
        Long productId,
        String productCode,
        String productName,
        BigDecimal price,
        String priceDisplay,
        Integer quantity,
        BigDecimal lineTotal,
        String lineTotalDisplay,
        String imageUrl
) {}
