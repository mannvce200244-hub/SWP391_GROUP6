package com.m4n.backend.exception;

public class InvalidFilterException extends IllegalArgumentException {

    public InvalidFilterException(String message) {
        super(message);
    }
}
