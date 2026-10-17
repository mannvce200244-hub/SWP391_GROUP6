package com.m4n.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PosSalePreviewResponse {

    private List<PreviewItem> items;
    private BigDecimal subtotal;
    private String formattedSubtotal;
    private BigDecimal discount;
    private String formattedDiscount;
    private BigDecimal finalAmount;
    private String formattedFinalAmount;
    private boolean voucherApplied;
    private String voucherMessage;
    private List<String> stockWarnings;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PreviewItem {
        private Long productId;
        private String productCode;
        private String productName;
        private BigDecimal price;
        private String formattedPrice;
        private Integer quantity;
        private BigDecimal lineTotal;
        private String formattedLineTotal;
        private Integer availableQuantity;
        private boolean isSufficient;
    }
}
