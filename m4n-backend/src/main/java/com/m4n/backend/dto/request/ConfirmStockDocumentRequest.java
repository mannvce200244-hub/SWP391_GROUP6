package com.m4n.backend.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

public record ConfirmStockDocumentRequest(
        @Min(value = 0, message = "Số lượng bị loại không được âm") Integer rejectedQuantity,
        @Size(max = 500, message = "Lý do loại hàng không quá 500 ký tự") String rejectionReason
) {}
