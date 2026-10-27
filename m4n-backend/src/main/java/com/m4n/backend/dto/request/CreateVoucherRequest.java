package com.m4n.backend.dto.request;

import com.m4n.backend.entity.PromotionType;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Digits;

import java.math.BigDecimal;
import java.time.Instant;

public record CreateVoucherRequest(
        @NotBlank(message = "Mã voucher không được để trống")
        @Size(max = 50, message = "Mã voucher không quá 50 ký tự")
        String code,

        @DecimalMin(value = "0", message = "Tỷ lệ giảm giá không được âm")
        @DecimalMax(value = "1.0000", message = "Tỷ lệ giảm giá tối đa 1.0 (100%)")
        @Digits(integer = 1, fraction = 4, message = "Tỷ lệ giảm giá tối đa 4 chữ số thập phân")
        BigDecimal discountRate,

        @NotNull(message = "Giá trị đơn hàng tối thiểu không được để trống")
        @DecimalMin(value = "0.00", message = "Giá trị tối thiểu không âm")
        @Digits(integer = 13, fraction = 2, message = "Giá trị tối thiểu tối đa 13 chữ số và 2 chữ số thập phân")
        BigDecimal minimumOrderValue,

        Boolean isActive,

        @Size(max = 255, message = "Mô tả không quá 255 ký tự")
        String description,

        Instant validFrom,

        Instant validUntil,

        @Positive(message = "Số lượt sử dụng phải lớn hơn 0")
        Integer usageLimit,

        PromotionType promotionType,

        @Positive(message = "Số lượng tối thiểu phải lớn hơn 0")
        Integer minimumQuantity,

        @DecimalMin(value = "0", inclusive = false, message = "Mức giảm phí vận chuyển phải lớn hơn 0")
        @Digits(integer = 13, fraction = 0, message = "Mức giảm phí vận chuyển là số nguyên tối đa 13 chữ số")
        BigDecimal fixedDiscountAmount
) {
    public CreateVoucherRequest(String code, BigDecimal discountRate, BigDecimal minimumOrderValue,
                                Boolean isActive, String description, Instant validFrom, Instant validUntil,
                                Integer usageLimit, PromotionType promotionType, Integer minimumQuantity) {
        this(code, discountRate, minimumOrderValue, isActive, description, validFrom, validUntil, usageLimit,
                promotionType, minimumQuantity, null);
    }
    public CreateVoucherRequest(String code, BigDecimal discountRate, BigDecimal minimumOrderValue,
                                Boolean isActive, String description) {
        this(code, discountRate, minimumOrderValue, isActive, description, null, null, null, PromotionType.MANUAL, null);
    }

    public CreateVoucherRequest(String code, BigDecimal discountRate, BigDecimal minimumOrderValue,
                                Boolean isActive, String description, Instant validFrom,
                                Instant validUntil, Integer usageLimit) {
        this(code, discountRate, minimumOrderValue, isActive, description, validFrom,
                validUntil, usageLimit, PromotionType.MANUAL, null);
    }
}
