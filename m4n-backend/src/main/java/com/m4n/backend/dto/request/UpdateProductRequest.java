package com.m4n.backend.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import jakarta.validation.Valid;

import java.math.BigDecimal;
import java.util.List;

public record UpdateProductRequest(
        @NotBlank(message = "Tên sản phẩm không được để trống")
        @Size(max = 200, message = "Tên sản phẩm không được vượt quá 200 ký tự")
        String name,

        @Size(max = 100, message = "Barcode không được vượt quá 100 ký tự")
        String barcode,

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

        Boolean isActive,

        List<@NotNull @Valid ProductMediaItemRequest> media,

        @Min(value = 0, message = "Ngưỡng cảnh báo tồn kho không được âm")
        Integer lowStockThreshold,
        @DecimalMin(value = "0", inclusive = false, message = "Trọng lượng tính cước phải lớn hơn 0")
        BigDecimal billableWeightKg,
        @DecimalMin(value = "0", message = "Phụ phí cồng kềnh không được âm")
        @Digits(integer = 13, fraction = 0, message = "Phụ phí là số VND nguyên, tối đa 13 chữ số")
        BigDecimal bulkySurcharge,
        @Size(max = 100, message = "Nhóm biến thể tối đa 100 ký tự")
        String variantGroup,
        @Size(max = 100, message = "Tên biến thể tối đa 100 ký tự")
        String variantLabel,
        @Size(max = 48, message = "Tên nhóm phân loại 1 tối đa 48 ký tự")
        String option1Name,
        @Size(max = 48, message = "Tên nhóm phân loại 2 tối đa 48 ký tự")
        String option2Name,
        @Size(max = 48, message = "Giá trị phân loại 1 tối đa 48 ký tự")
        String option1Value,
        @Size(max = 48, message = "Giá trị phân loại 2 tối đa 48 ký tự")
        String option2Value
) {
    public UpdateProductRequest(
            String name, String barcode, BigDecimal price, Long categoryId,
            Long artisanId, Long craftVillageId, String material, String dimensions,
            String musicalRange, String origin, String description, Boolean isActive,
            List<ProductMediaItemRequest> media, Integer lowStockThreshold,
            BigDecimal billableWeightKg, BigDecimal bulkySurcharge,
            String variantGroup, String variantLabel
    ) {
        this(name, barcode, price, categoryId, artisanId, craftVillageId, material,
                dimensions, musicalRange, origin, description, isActive, media,
                lowStockThreshold, billableWeightKg, bulkySurcharge, variantGroup, variantLabel,
                null, null, null, null);
    }
}
