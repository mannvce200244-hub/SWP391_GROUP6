package com.m4n.backend.exception;

public class MomoCreateRejectedException extends PaymentProviderException {
    private final String resultCode;

    public MomoCreateRejectedException(String resultCode) {
        this.resultCode = resultCode;
    }

    public String resultCode() { return resultCode; }
}
