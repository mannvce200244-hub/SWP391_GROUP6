package com.m4n.backend.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record DirectPurchaseRequest(
        @NotNull @Positive Long productId,
        @NotNull @Positive Integer quantity
) {}
