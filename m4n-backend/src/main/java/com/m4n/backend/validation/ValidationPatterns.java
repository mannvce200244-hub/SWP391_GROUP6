package com.m4n.backend.validation;

public final class ValidationPatterns {

    public static final String VIETNAMESE_MOBILE = "^(03|05|07|08|09)\\d{8}$";
    public static final String OPTIONAL_VIETNAMESE_MOBILE = "^$|" + VIETNAMESE_MOBILE;
    public static final String VIETNAMESE_MOBILE_MESSAGE =
            "Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 03, 05, 07, 08 hoặc 09";

    private ValidationPatterns() {
    }
}
