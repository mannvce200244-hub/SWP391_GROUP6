package com.m4n.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateArtisanRequest(
        @NotBlank(message = "Tên nghệ nhân không được để trống")
        @Size(max = 150, message = "Tên nghệ nhân không được vượt quá 150 ký tự")
        String name,

        String biography,

        @Size(max = 500, message = "Đường dẫn ảnh đại diện không được vượt quá 500 ký tự")
        String avatarUrl,

        Long craftVillageId
) {}
