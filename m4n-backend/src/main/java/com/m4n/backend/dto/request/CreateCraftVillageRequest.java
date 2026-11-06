package com.m4n.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateCraftVillageRequest(
        @NotBlank(message = "Tên làng nghề không được để trống")
        @Size(max = 150, message = "Tên làng nghề không được vượt quá 150 ký tự")
        String name,

        @NotBlank(message = "Địa chỉ/Vị trí không được để trống")
        @Size(max = 255, message = "Địa chỉ/Vị trí không được vượt quá 255 ký tự")
        String location,

        String description,

        @Size(max = 500, message = "Đường dẫn hình ảnh không được vượt quá 500 ký tự")
        String imageUrl
) {}
