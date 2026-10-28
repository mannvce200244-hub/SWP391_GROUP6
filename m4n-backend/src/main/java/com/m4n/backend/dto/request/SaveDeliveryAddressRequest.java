package com.m4n.backend.dto.request;

import com.m4n.backend.validation.ValidationPatterns;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

public record SaveDeliveryAddressRequest(
        @NotBlank(message = "Vui lòng nhập họ tên người nhận.")
        @Size(max = 150, message = "Họ tên tối đa 150 ký tự.") String customerName,
        @NotBlank(message = "Vui lòng nhập số điện thoại.") @Pattern(regexp = ValidationPatterns.VIETNAMESE_MOBILE,
                message = ValidationPatterns.VIETNAMESE_MOBILE_MESSAGE) String customerPhone,
        @NotBlank(message = "Vui lòng nhập email nhận thông báo.")
        @Email(message = "Email không đúng định dạng.")
        @Size(max = 150, message = "Email tối đa 150 ký tự.") String customerEmail,
        @Size(max = 300, message = "Địa chỉ tối đa 300 ký tự.") String shippingAddress,
        @Size(max = 500, message = "Ghi chú tối đa 500 ký tự.") String notes,
        @Valid DeliveryAddressRequest deliveryAddress,
        @PositiveOrZero(message = "Phiên bản địa chỉ không hợp lệ.") Long expectedVersion) {}
