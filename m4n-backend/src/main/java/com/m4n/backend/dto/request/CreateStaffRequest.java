package com.m4n.backend.dto.request;

import com.m4n.backend.entity.RoleName;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import com.m4n.backend.validation.ValidationPatterns;

public record CreateStaffRequest(
        @NotBlank(message = "Họ và tên không được để trống")
        @Size(max = 150, message = "Họ và tên tối đa 150 ký tự")
        String fullName,

        @NotBlank(message = "Email không được để trống")
        @Email(message = "Định dạng email không hợp lệ")
        @Size(max = 255, message = "Email không được vượt quá 255 ký tự")
        String email,

        @NotNull(message = "Vai trò nhân viên không được để trống")
        RoleName role,

        @Pattern(regexp = ValidationPatterns.OPTIONAL_VIETNAMESE_MOBILE,
                message = ValidationPatterns.VIETNAMESE_MOBILE_MESSAGE)
        String phone,

        @Size(max = 255, message = "Địa chỉ tối đa 255 ký tự")
        String address,

        @NotBlank(message = "Mật khẩu ban đầu không được để trống")
        @Size(min = 8, max = 72, message = "Mật khẩu ban đầu phải từ 8 đến 72 ký tự")
        String initialPassword
) {}
