package com.m4n.backend.dto.request;
import jakarta.validation.constraints.Size;

public record CheckoutPreviewRequest(
        @Size(max = 50) String voucherCode,
        @Size(max = 50) String shippingVoucherCode
) {
    public CheckoutPreviewRequest(String voucherCode) { this(voucherCode, null); }
}
