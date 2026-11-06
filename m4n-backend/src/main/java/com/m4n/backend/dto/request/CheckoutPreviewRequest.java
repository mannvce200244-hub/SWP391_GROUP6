package com.m4n.backend.dto.request;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.util.List;

public record CheckoutPreviewRequest(
        @Size(max = 50) String voucherCode,
        @Size(max = 50) String shippingVoucherCode,
        @Size(min = 1, max = 100, message = "Vui lòng chọn từ 1 đến 100 sản phẩm trong giỏ hàng")
        List<@NotNull(message = "Mục giỏ hàng không hợp lệ") @Positive(message = "Mục giỏ hàng không hợp lệ") Long> cartItemIds,
        @jakarta.validation.Valid DeliveryAddressRequest deliveryAddress,
        @Size(max = 150) String recipientName,
        @jakarta.validation.constraints.Pattern(regexp = com.m4n.backend.validation.ValidationPatterns.OPTIONAL_VIETNAMESE_MOBILE) String recipientPhone,
        @jakarta.validation.Valid DirectPurchaseRequest directPurchase
) {
    public CheckoutPreviewRequest(String voucherCode, String shippingVoucherCode, List<Long> cartItemIds,
            DeliveryAddressRequest deliveryAddress, String recipientName, String recipientPhone) {
        this(voucherCode, shippingVoucherCode, cartItemIds, deliveryAddress, recipientName, recipientPhone, null);
    }
    public CheckoutPreviewRequest(String voucherCode, String shippingVoucherCode, List<Long> cartItemIds) {
        this(voucherCode, shippingVoucherCode, cartItemIds, null, null, null);
    }
    public CheckoutPreviewRequest(String voucherCode) { this(voucherCode, null, null); }
    public CheckoutPreviewRequest(String voucherCode, String shippingVoucherCode) {
        this(voucherCode, shippingVoucherCode, null);
    }
}
