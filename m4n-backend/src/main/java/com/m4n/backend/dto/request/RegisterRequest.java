package com.m4n.backend.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import com.m4n.backend.validation.ValidationPatterns;

public record RegisterRequest(
        @NotBlank(message = "Họ và tên không được để trống")
        @Size(max = 150, message = "Họ và tên không được vượt quá 150 ký tự")
        String fullName,

        @NotBlank(message = "Email không được để trống")
        @Email(message = "Email không đúng định dạng")
        @Size(max = 255, message = "Email không được vượt quá 255 ký tự")
        String email,

        @NotBlank(message = "Mật khẩu không được để trống")
        @Size(min = 8, max = 72, message = "Mật khẩu phải từ 8 đến 72 ký tự")
        String password,

        @Pattern(regexp = ValidationPatterns.OPTIONAL_VIETNAMESE_MOBILE,
                message = ValidationPatterns.VIETNAMESE_MOBILE_MESSAGE)
        String phone,

        @Size(max = 255, message = "Địa chỉ không được vượt quá 255 ký tự")
        String address
) {
    public RegisterRequest(String fullName, String email, String password, String phone) {
        this(fullName, email, password, phone, null);
    }
}
