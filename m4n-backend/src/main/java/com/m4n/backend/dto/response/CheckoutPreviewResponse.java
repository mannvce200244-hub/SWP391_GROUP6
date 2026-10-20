package com.m4n.backend.dto.response;

import java.math.BigDecimal;
import java.util.List;

public record CheckoutPreviewResponse(
        List<CartItemResponse> items,
        int totalItems,
        BigDecimal subtotal,
        String subtotalDisplay,
        String voucherCode,
        BigDecimal discountAmount,
        String discountAmountDisplay,
        BigDecimal finalAmount,
        String finalAmountDisplay,
        boolean voucherApplied,
        String voucherMessage
) {}
