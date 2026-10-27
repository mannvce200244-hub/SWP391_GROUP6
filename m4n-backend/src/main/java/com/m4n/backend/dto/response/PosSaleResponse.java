package com.m4n.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PosSaleResponse {

    private Long invoiceId;
    private String invoiceCode;
    private String staffName;
    private String customerName;
    private String customerPhone;
    private BigDecimal subtotal;
    private String formattedSubtotal;
    private BigDecimal discount;
    private String formattedDiscount;
    private BigDecimal finalAmount;
    private String formattedFinalAmount;
    private String voucherCode;
    private BigDecimal manualDiscountAmount;
    private BigDecimal automaticDiscountAmount;
    private String automaticPromotionCode;
    private BigDecimal originalTotalAmount;
    private BigDecimal productDiscountAmount;
    private BigDecimal shippingFee;
    private String paymentMethod;
    private BigDecimal amountReceived;
    private String formattedAmountReceived;
    private BigDecimal amountChange;
    private String formattedAmountChange;
    private String notes;
    private Instant createdAt;
    private List<SaleItemResponse> items;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SaleItemResponse {
        private Long id;
        private Long productId;
        private String productCode;
        private String productName;
        private BigDecimal unitPrice;
        private BigDecimal originalUnitPrice;
        private BigDecimal productDiscountAmount;
        private String formattedUnitPrice;
        private Integer quantity;
        private BigDecimal lineAmount;
        private String formattedLineAmount;
    }
}
