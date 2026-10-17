package com.m4n.backend.exception;

public class StaleVersionException extends RuntimeException {
    public StaleVersionException(String message) {
        super(message);
    }
}
