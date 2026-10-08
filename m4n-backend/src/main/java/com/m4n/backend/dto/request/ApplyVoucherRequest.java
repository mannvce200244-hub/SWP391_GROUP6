package com.m4n.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;

public record ApplyVoucherRequest(
        @NotBlank(message = "Mã voucher không được để trống")
        String voucherCode,

        @NotNull(message = "Giá trị đơn hàng không được để trống")
        @PositiveOrZero(message = "Giá trị đơn hàng không hợp lệ")
        BigDecimal orderAmount
) {}
