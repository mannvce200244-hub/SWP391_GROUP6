package com.m4n.backend.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record StockIssueRequest(
        @NotNull(message = "Số lượng xuất điều chỉnh không được để trống")
        @Min(value = 1, message = "Số lượng xuất điều chỉnh tối thiểu là 1")
        Integer quantity,
        @NotBlank(message = "Lý do điều chỉnh không được để trống")
        @Size(max = 500, message = "Lý do điều chỉnh không được vượt quá 500 ký tự")
        String reason
) {}
