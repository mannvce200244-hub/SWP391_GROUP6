package com.m4n.backend.dto.response;
public record PaymentOptionsResponse(boolean vnpayAvailable, boolean momoAvailable) {
    public PaymentOptionsResponse(boolean vnpayAvailable) { this(vnpayAvailable, false); }
}
