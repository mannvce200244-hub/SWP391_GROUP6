package com.m4n.backend.dto.request;

import com.m4n.backend.entity.MediaType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateProductMediaRequest(
        MediaType mediaType,

        @NotBlank(message = "Đường dẫn media không được để trống")
        @Size(max = 500, message = "Đường dẫn media không được vượt quá 500 ký tự")
        String url,

        @Size(max = 255, message = "Mô tả thay thế (alt) không được vượt quá 255 ký tự")
        String altText,

        Integer sortOrder
) {}
