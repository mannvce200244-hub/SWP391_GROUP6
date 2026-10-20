package com.m4n.backend.exception;

public class ProductNotFoundException extends ResourceNotFoundException {

    public ProductNotFoundException(Long productId) {
        super("Sản phẩm không tồn tại với ID: " + productId);
    }

    public ProductNotFoundException(String message) {
        super(message);
    }
}
