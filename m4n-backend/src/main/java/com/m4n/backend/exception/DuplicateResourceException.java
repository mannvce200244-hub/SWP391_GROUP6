package com.m4n.backend.exception;

public class DuplicateResourceException extends RuntimeException {

    private final String errorCode;

    public DuplicateResourceException(String message) {
        super(message);
        this.errorCode = "DUPLICATE_RESOURCE";
    }

    public DuplicateResourceException(String message, String errorCode) {
        super(message);
        this.errorCode = errorCode;
    }

    public String getErrorCode() {
        return errorCode;
    }
}
