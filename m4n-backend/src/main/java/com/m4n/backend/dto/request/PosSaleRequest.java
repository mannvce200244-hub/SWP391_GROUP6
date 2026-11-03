package com.m4n.backend.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
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
    private List<@NotNull(message = "Sản phẩm trong hóa đơn không được để trống") @Valid PosSaleItemRequest> items;

    @Size(max = 50, message = "Mã voucher không quá 50 ký tự")
    private String voucherCode;

    @NotBlank(message = "Phương thức thanh toán không được để trống")
    private String paymentMethod; // CASH, BANK_TRANSFER

    @DecimalMin(value = "0", message = "Tiền khách đưa không được âm")
    @Digits(integer = 12, fraction = 0, message = "Tiền khách đưa phải là số nguyên VND tối đa 12 chữ số")
    private BigDecimal amountReceived;

    @Size(max = 150, message = "Họ tên khách hàng không quá 150 ký tự")
    private String customerName;

    @Pattern(regexp = ValidationPatterns.OPTIONAL_VIETNAMESE_MOBILE,
            message = ValidationPatterns.VIETNAMESE_MOBILE_MESSAGE)
    private String customerPhone;

    @Positive
    private Long customerId;

    @Positive
    private Long posCustomerId;

    @Size(max = 500, message = "Ghi chú không quá 500 ký tự")
    private String notes;
}
