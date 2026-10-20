package com.m4n.backend.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateReviewRequest(
        @NotNull(message = "ID đơn hàng không được để trống")
        Long orderId,

        @NotNull(message = "ID sản phẩm không được để trống")
        Long productId,

        @NotNull(message = "Đánh giá sao không được để trống")
        @Min(value = 1, message = "Đánh giá tối thiểu 1 sao")
        @Max(value = 5, message = "Đánh giá tối đa 5 sao")
        Integer rating,

        @Size(max = 1000, message = "Nội dung đánh giá không quá 1000 ký tự")
        String comment
) {
}
