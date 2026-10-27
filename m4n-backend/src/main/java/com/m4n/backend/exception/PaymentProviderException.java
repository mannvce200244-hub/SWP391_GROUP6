package com.m4n.backend.exception;
public class PaymentProviderException extends RuntimeException {
    public PaymentProviderException() { super("Payment provider result was not verified."); }
}
