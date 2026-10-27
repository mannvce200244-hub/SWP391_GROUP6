package com.m4n.backend.service;

import java.math.BigDecimal;

public record ShippingQuote(BigDecimal baseShippingFee, BigDecimal shippingDiscountAmount,
        BigDecimal shippingFee, boolean freeShippingApplied) {}
