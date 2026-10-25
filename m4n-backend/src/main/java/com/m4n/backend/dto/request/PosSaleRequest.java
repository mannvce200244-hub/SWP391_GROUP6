package com.m4n.backend.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import com.m4n.backend.validation.ValidationPatterns;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PosSaleRequest {

    @NotEmpty(message = "Danh sách sản phẩm không được để trống")
    @Valid
    private List<PosSaleItemRequest> items;

    private String voucherCode;

    @NotBlank(message = "Phương thức thanh toán không được để trống")
    private String paymentMethod; // CASH, BANK_TRANSFER

    @DecimalMin(value = "0", message = "Tiền khách đưa không được âm")
    @Digits(integer = 15, fraction = 0, message = "Tiền khách đưa phải là số nguyên VND, không nhập phần thập phân")
    private BigDecimal amountReceived;

    private String customerName;

    @Pattern(regexp = ValidationPatterns.OPTIONAL_VIETNAMESE_MOBILE,
            message = ValidationPatterns.VIETNAMESE_MOBILE_MESSAGE)
    private String customerPhone;

    private String notes;
}
