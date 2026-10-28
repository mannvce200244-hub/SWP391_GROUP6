package com.m4n.backend.service;
import java.math.BigDecimal;

public record CarrierShippingQuote(BigDecimal fee, String fullAddress) {}
