package com.m4n.backend.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;

public record CreateProductRequest(
        @Size(max = 50, message = "Mã sản phẩm không được vượt quá 50 ký tự")
        String code,

        @Size(max = 100, message = "Barcode không được vượt quá 100 ký tự")
        String barcode,

        @NotBlank(message = "Tên sản phẩm không được để trống")
        @Size(max = 200, message = "Tên sản phẩm không được vượt quá 200 ký tự")
        String name,

        @NotNull(message = "Giá sản phẩm không được để trống")
        @DecimalMin(value = "0", inclusive = false, message = "Giá niêm yết phải lớn hơn 0")
        @Digits(integer = 12, fraction = 2, message = "Giá tối đa 12 chữ số nguyên và 2 chữ số thập phân")
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

        List<@Valid CreateProductMediaRequest> media,

        @Min(value = 0, message = "Ngưỡng cảnh báo tồn kho không được âm")
        Integer lowStockThreshold,
        @DecimalMin(value = "0", inclusive = false, message = "Trọng lượng tính cước phải lớn hơn 0")
        @Digits(integer = 7, fraction = 3, message = "Trọng lượng tối đa 7 chữ số nguyên và 3 chữ số thập phân")
        BigDecimal billableWeightKg,
        @DecimalMin(value = "0", message = "Phụ phí cồng kềnh không được âm")
        @Digits(integer = 13, fraction = 0, message = "Phụ phí là số VND nguyên, tối đa 13 chữ số")
        BigDecimal bulkySurcharge
) {}
