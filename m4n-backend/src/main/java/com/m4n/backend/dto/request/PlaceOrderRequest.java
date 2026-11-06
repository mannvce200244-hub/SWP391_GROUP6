package com.m4n.backend.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import com.m4n.backend.validation.ValidationPatterns;

import java.util.List;

public record PlaceOrderRequest(
        @NotBlank(message = "Họ tên người nhận không được để trống")
        @Size(max = 150, message = "Họ tên không được vượt quá 150 ký tự")
        String customerName,

        @NotBlank(message = "Số điện thoại không được để trống")
        @Pattern(regexp = ValidationPatterns.VIETNAMESE_MOBILE,
                message = ValidationPatterns.VIETNAMESE_MOBILE_MESSAGE)
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

        @Size(max = 50, message = "Mã voucher không quá 50 ký tự") String voucherCode,

        @Size(max = 500, message = "Ghi chú không được vượt quá 500 ký tự")
        String notes,
        @Size(max = 50, message = "Mã voucher vận chuyển không quá 50 ký tự") String shippingVoucherCode,

        @Size(min = 1, max = 100, message = "Vui lòng chọn từ 1 đến 100 sản phẩm trong giỏ hàng")
        List<@NotNull(message = "Mục giỏ hàng không hợp lệ") @Positive(message = "Mục giỏ hàng không hợp lệ") Long> cartItemIds,
        @jakarta.validation.Valid DeliveryAddressRequest deliveryAddress,
        @jakarta.validation.constraints.DecimalMin("0") @jakarta.validation.constraints.Digits(integer = 13, fraction = 2) java.math.BigDecimal expectedShippingFee,
        @jakarta.validation.Valid DirectPurchaseRequest directPurchase
) {
    public PlaceOrderRequest(String name, String phone, String email, String address, String paymentMethod,
            String voucherCode, String notes, String shippingVoucherCode, List<Long> cartItemIds,
            DeliveryAddressRequest deliveryAddress, java.math.BigDecimal expectedShippingFee) {
        this(name, phone, email, address, paymentMethod, voucherCode, notes, shippingVoucherCode,
                cartItemIds, deliveryAddress, expectedShippingFee, null);
    }
    public PlaceOrderRequest(String name, String phone, String email, String address, String paymentMethod,
            String voucherCode, String notes, String shippingVoucherCode, List<Long> cartItemIds) {
        this(name, phone, email, address, paymentMethod, voucherCode, notes, shippingVoucherCode, cartItemIds, null, null);
    }
    public PlaceOrderRequest(String name, String phone, String email, String address, String paymentMethod, String voucherCode, String notes) {
        this(name, phone, email, address, paymentMethod, voucherCode, notes, null, null);
    }

    public PlaceOrderRequest(String name, String phone, String email, String address, String paymentMethod,
                             String voucherCode, String notes, String shippingVoucherCode) {
        this(name, phone, email, address, paymentMethod, voucherCode, notes, shippingVoucherCode, null);
    }
}
