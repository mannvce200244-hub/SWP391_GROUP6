package com.m4n.backend.dto.request;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public record UpdateShippingSettingsRequest(
        @NotNull(message = "Vui lòng chọn trạng thái tính phí vận chuyển.") Boolean enabled,
        @NotNull(message = "Vui lòng nhập đơn giá theo kg.") @DecimalMin(value = "0", message = "Đơn giá không được âm.") @Digits(integer = 12, fraction = 2, message = "Đơn giá tối đa 12 chữ số nguyên và 2 chữ số thập phân.") BigDecimal ratePerKg,
        @NotNull(message = "Vui lòng chọn trạng thái miễn phí vận chuyển.") Boolean freeShippingEnabled,
        @DecimalMin(value = "0", message = "Ngưỡng miễn phí không được âm.") @Digits(integer = 13, fraction = 0, message = "Ngưỡng miễn phí tối đa 13 chữ số nguyên.") BigDecimal freeShippingThreshold,
        @NotNull(message = "Thiếu phiên bản cấu hình. Vui lòng tải lại.") @PositiveOrZero(message = "Phiên bản cấu hình không hợp lệ.") Long expectedVersion
) {}
