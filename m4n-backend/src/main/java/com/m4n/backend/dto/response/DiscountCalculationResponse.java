package com.m4n.backend.dto.response;

import java.math.BigDecimal;

public record DiscountCalculationResponse(
        VoucherValidationResponse manualVoucher,
        VoucherValidationResponse automaticPromotion,
        BigDecimal manualDiscountAmount,
        BigDecimal automaticDiscountAmount,
        BigDecimal totalDiscountAmount,
        BigDecimal finalAmount
) {}
