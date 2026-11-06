package com.m4n.backend.dto.response;

import java.math.BigDecimal;

public record VoucherValidationResponse(
        String code,
        BigDecimal discountRate,
        BigDecimal minimumOrderValue,
        BigDecimal discountAmount,
        String discountAmountDisplay,
        BigDecimal finalAmount,
        String finalAmountDisplay,
        boolean isValid,
        String message
) {}
