package com.m4n.backend.dto.response;

import java.math.BigDecimal;
import java.time.Instant;

public record PosMomoPaymentResponse(String id, BigDecimal amount, String status, String refundStatus,
        String paymentUrl, Instant expiresAt, Long invoiceId, String message, boolean cancelRequested) {}
