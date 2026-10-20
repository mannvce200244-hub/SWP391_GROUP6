package com.m4n.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateCategoryRequest(
        @NotBlank(message = "Tên danh mục không được để trống")
        @Size(max = 150, message = "Tên danh mục không được vượt quá 150 ký tự")
        String name,

        String description
) {}
