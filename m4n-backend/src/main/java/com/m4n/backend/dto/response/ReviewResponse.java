package com.m4n.backend.dto.response;

import java.time.Instant;

public record ReviewResponse(
        Long id,
        Long productId,
        Long userId,
        String customerName,
        Long orderId,
        Integer rating,
        String comment,
        Instant createdAt
) {
}
