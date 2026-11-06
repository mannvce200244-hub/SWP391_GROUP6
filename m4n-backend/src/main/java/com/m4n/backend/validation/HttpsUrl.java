package com.m4n.backend.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.*;

@Target({ElementType.FIELD, ElementType.PARAMETER, ElementType.RECORD_COMPONENT})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = HttpsUrlValidator.class)
public @interface HttpsUrl {
    String message() default "Vui lòng nhập URL HTTPS hợp lệ, không chứa thông tin đăng nhập.";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}
