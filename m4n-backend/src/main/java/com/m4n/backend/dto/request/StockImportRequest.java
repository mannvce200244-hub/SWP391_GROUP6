package com.m4n.backend.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
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

    private String notes;
}
