package com.m4n.backend.dto.response;

import com.m4n.backend.entity.OrderStatus;

public record OrderConfirmResultResponse(
        Long orderId,
        String orderCode,
        OrderStatus previousStatus,
        OrderStatus newStatus,
        String message,
        boolean stockDeducted
) {}
