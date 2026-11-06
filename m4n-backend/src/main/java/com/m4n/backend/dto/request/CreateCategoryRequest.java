package com.m4n.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateCategoryRequest(
        @NotBlank(message = "Mã danh mục không được để trống")
        @Size(max = 50, message = "Mã danh mục không được vượt quá 50 ký tự")
        String code,

        @NotBlank(message = "Tên danh mục không được để trống")
        @Size(max = 150, message = "Tên danh mục không được vượt quá 150 ký tự")
        String name,

        String description
) {}
