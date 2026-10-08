package com.m4n.backend.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PlaceOrderRequest(
        @NotBlank(message = "Họ tên người nhận không được để trống")
        @Size(max = 150, message = "Họ tên không được vượt quá 150 ký tự")
        String customerName,

        @NotBlank(message = "Số điện thoại không được để trống")
        @Size(max = 30, message = "Số điện thoại không được vượt quá 30 ký tự")
        String customerPhone,

        @NotBlank(message = "Email không được để trống")
        @Email(message = "Email không đúng định dạng")
        @Size(max = 150, message = "Email không được vượt quá 150 ký tự")
        String customerEmail,

        @NotBlank(message = "Địa chỉ nhận hàng không được để trống")
        @Size(max = 300, message = "Địa chỉ không được vượt quá 300 ký tự")
        String shippingAddress,

        @NotBlank(message = "Phương thức thanh toán không được để trống")
        String paymentMethod,

        String voucherCode,

        @Size(max = 500, message = "Ghi chú không được vượt quá 500 ký tự")
        String notes
) {}
