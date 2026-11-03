package com.m4n.backend.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.Digits;
import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockImportRequest {

    @NotNull(message = "Số lượng nhập kho không được để trống")
    @Min(value = 1, message = "Số lượng nhập kho tối thiểu là 1")
    private Integer quantity;

    @Size(max = 500, message = "Ghi chú nhập kho không quá 500 ký tự")
    private String notes;

    @NotNull(message = "Vui lòng nhập đơn giá nhập")
    @DecimalMin(value = "0", message = "Đơn giá nhập không được âm")
    @DecimalMax(value = "9999999999", message = "Đơn giá nhập vượt giới hạn hỗ trợ")
    @Digits(integer = 10, fraction = 0, message = "Đơn giá nhập phải là số đồng nguyên")
    private BigDecimal unitCost;
}
