package com.m4n.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import com.m4n.backend.validation.ValidationPatterns;

public record UpdateUserRequest(
        @NotBlank(message = "Họ và tên không được để trống")
        @Size(max = 150, message = "Họ và tên tối đa 150 ký tự")
        String fullName,

        @Pattern(regexp = ValidationPatterns.OPTIONAL_VIETNAMESE_MOBILE,
                message = ValidationPatterns.VIETNAMESE_MOBILE_MESSAGE)
        String phone,

        @Size(max = 255, message = "Địa chỉ tối đa 255 ký tự")
        String address,

        @NotNull(message = "Phiên bản dữ liệu (version) không được để trống để đảm bảo tránh xung đột đồng thời")
        Long expectedVersion
) {}
