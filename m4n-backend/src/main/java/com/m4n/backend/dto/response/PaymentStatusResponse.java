package com.m4n.backend.dto.response;
public record PaymentStatusResponse(Long orderId, String paymentMethod, boolean isPaid, String status,
                                    String refundStatus, boolean canRefund, boolean canPay,
                                    java.time.Instant paymentExpiresAt, String message) {}
