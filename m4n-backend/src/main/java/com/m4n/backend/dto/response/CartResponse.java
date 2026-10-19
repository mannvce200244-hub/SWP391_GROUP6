package com.m4n.backend.dto.response;

import java.math.BigDecimal;
import java.util.List;

public record CartResponse(
        Long id,
        Integer totalItems,
        List<CartItemResponse> items,
        BigDecimal totalAmount,
        String totalAmountDisplay
) {}
