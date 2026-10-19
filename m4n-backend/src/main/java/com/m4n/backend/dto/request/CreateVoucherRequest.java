package com.m4n.backend.dto.request;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record CreateVoucherRequest(
        @NotBlank(message = "Mã voucher không được để trống")
        @Size(max = 50, message = "Mã voucher không quá 50 ký tự")
        String code,

        @NotNull(message = "Tỷ lệ giảm giá không được để trống")
        @DecimalMin(value = "0.0001", message = "Tỷ lệ giảm giá phải lớn hơn 0")
        @DecimalMax(value = "1.0000", message = "Tỷ lệ giảm giá tối đa 1.0 (100%)")
        BigDecimal discountRate,

        @NotNull(message = "Giá trị đơn hàng tối thiểu không được để trống")
        @DecimalMin(value = "0.00", message = "Giá trị tối thiểu không âm")
        BigDecimal minimumOrderValue,

        Boolean isActive,

        @Size(max = 255, message = "Mô tả không quá 255 ký tự")
        String description
) {
}
