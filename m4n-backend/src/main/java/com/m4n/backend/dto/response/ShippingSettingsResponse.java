package com.m4n.backend.dto.response;

import java.math.BigDecimal;
import java.time.Instant;

public record ShippingSettingsResponse(boolean enabled, BigDecimal ratePerKg, boolean freeShippingEnabled,
        BigDecimal freeShippingThreshold, Long version, Instant updatedAt) {}
