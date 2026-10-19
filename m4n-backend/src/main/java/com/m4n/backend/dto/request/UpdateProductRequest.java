package com.m4n.backend.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record UpdateProductRequest(
        @NotBlank(message = "Tên sản phẩm không được để trống")
        @Size(max = 200, message = "Tên sản phẩm không được vượt quá 200 ký tự")
        String name,

        @Size(max = 100, message = "Barcode không được vượt quá 100 ký tự")
        String barcode,

        @NotNull(message = "Giá sản phẩm không được để trống")
        @DecimalMin(value = "0.01", message = "Giá sản phẩm phải lớn hơn 0")
        BigDecimal price,

        @NotNull(message = "Danh mục sản phẩm là bắt buộc")
        Long categoryId,

        Long artisanId,

        Long craftVillageId,

        @Size(max = 255, message = "Chất liệu không được vượt quá 255 ký tự")
        String material,

        @Size(max = 100, message = "Kích thước không được vượt quá 100 ký tự")
        String dimensions,

        @Size(max = 100, message = "Âm vực không được vượt quá 100 ký tự")
        String musicalRange,

        @Size(max = 150, message = "Xuất xứ không được vượt quá 150 ký tự")
        String origin,

        String description,

        Boolean isActive
) {}
