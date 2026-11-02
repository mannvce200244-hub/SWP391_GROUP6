package com.m4n.backend.dto.request;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.Instant;

public record UpdateProductPromotionRequest(
        @NotNull(message = "Vui lòng chọn sản phẩm.") @Positive(message = "ID sản phẩm không hợp lệ.") Long productId,
        @NotBlank(message = "Vui lòng nhập tên chương trình.") @Size(max = 150, message = "Tên chương trình tối đa 150 ký tự.") String name,
        @NotNull(message = "Vui lòng nhập tỷ lệ giảm.") @DecimalMin(value = "0", message = "Tỷ lệ giảm không được âm.") @DecimalMax(value = "1", message = "Tỷ lệ giảm không được vượt quá 100%.") @Digits(integer = 2, fraction = 4, message = "Tỷ lệ giảm chỉ có tối đa 4 chữ số thập phân.") BigDecimal discountRate,
        @NotNull(message = "Vui lòng chọn trạng thái chương trình.") Boolean isActive,
        Instant validFrom,
        Instant validUntil,
        @NotNull(message = "Thiếu phiên bản chương trình. Vui lòng tải lại.") @PositiveOrZero(message = "Phiên bản chương trình không hợp lệ.") Long expectedVersion
) {}
