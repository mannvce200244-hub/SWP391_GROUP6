package com.m4n.backend.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record AddToCartRequest(
        @NotNull(message = "ID sản phẩm không được để trống")
        Long productId,

        @NotNull(message = "Số lượng không được để trống")
        @Min(value = 1, message = "Số lượng phải lớn hơn hoặc bằng 1")
        Integer quantity
) {}
