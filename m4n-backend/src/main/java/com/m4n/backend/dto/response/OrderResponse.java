package com.m4n.backend.dto.response;

import com.m4n.backend.entity.OrderStatus;

import java.math.BigDecimal;
import java.time.Instant;

public record OrderResponse(
        Long id,
        String orderCode,
        OrderStatus status,
        String statusLabel,
        String customerName,
        String customerPhone,
        String customerEmail,
        String shippingAddress,
        String notes,
        String itemsSummary,
        String imageUrl,
        BigDecimal totalAmount,
        String totalAmountDisplay,
        BigDecimal discountAmount,
        String discountAmountDisplay,
        BigDecimal finalAmount,
        String finalAmountDisplay,
        String paymentMethod,
        boolean isPaid,
        String voucherCode,
        int itemCount,
        Instant createdAt,
        BigDecimal manualDiscountAmount,
        BigDecimal automaticDiscountAmount,
        String automaticPromotionCode,
        BigDecimal originalTotalAmount,
        BigDecimal productDiscountAmount,
        BigDecimal baseShippingFee,
        BigDecimal shippingDiscountAmount,
        BigDecimal shippingFee,
        String shippingVoucherCode,
        boolean freeShippingApplied
) {}
