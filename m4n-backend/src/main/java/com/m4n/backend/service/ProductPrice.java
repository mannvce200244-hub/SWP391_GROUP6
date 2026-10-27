package com.m4n.backend.service;

import java.math.BigDecimal;

public record ProductPrice(BigDecimal originalUnitPrice, BigDecimal chargedUnitPrice,
        BigDecimal productDiscountAmount, Long productPromotionId) {}
