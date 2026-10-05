package com.m4n.backend.dto.response;

import java.math.BigDecimal;

public record CartItemResponse(
        Long id,
        Long productId,
        String productCode,
        String productName,
        BigDecimal unitPrice,
        String unitPriceDisplay,
        Integer quantity,
        BigDecimal subtotal,
        String subtotalDisplay,
        String imageUrl
) {}
