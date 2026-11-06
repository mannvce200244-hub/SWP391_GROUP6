package com.m4n.backend.validation;

import java.math.BigDecimal;

/** Validates calculated money against the shared NUMERIC(14,2) storage limit. */
public final class MoneyValidation {
    private static final BigDecimal MAXIMUM = new BigDecimal("999999999999.99");
    private MoneyValidation() {}

    public static void requireSupported(BigDecimal amount) {
        if (amount == null || amount.signum() < 0 || amount.compareTo(MAXIMUM) > 0
                || amount.stripTrailingZeros().scale() > 2) {
            throw new IllegalArgumentException("Số tiền vượt giới hạn hỗ trợ hoặc có quá 2 chữ số thập phân. Vui lòng kiểm tra giá và số lượng.");
        }
    }
}
