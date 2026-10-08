package com.m4n.backend.dto.response;

import com.m4n.backend.entity.OrderStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record OrderDetailResponse(
        Long id,
        String orderCode,
        OrderStatus status,
        String statusLabel,
        String customerName,
        String customerPhone,
        String customerEmail,
        String shippingAddress,
        String notes,
        BigDecimal totalAmount,
        String totalAmountDisplay,
        BigDecimal discountAmount,
        String discountAmountDisplay,
        BigDecimal finalAmount,
        String finalAmountDisplay,
        String paymentMethod,
        boolean isPaid,
        String voucherCode,
        List<OrderItemResponse> items,
        boolean canCustomerCancel,
        Instant createdAt,
        Instant updatedAt
) {}
