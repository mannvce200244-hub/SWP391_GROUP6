package com.m4n.backend.service;

import java.math.BigDecimal;

public record ShippingQuote(BigDecimal baseShippingFee, BigDecimal shippingDiscountAmount,
        BigDecimal shippingFee, boolean freeShippingApplied, String fullAddress) {
    public ShippingQuote(BigDecimal base, BigDecimal discount, BigDecimal fee, boolean free) {
        this(base, discount, fee, free, null);
    }
}
