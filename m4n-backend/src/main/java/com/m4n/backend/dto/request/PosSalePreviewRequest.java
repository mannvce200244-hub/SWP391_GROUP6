package com.m4n.backend.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PosSalePreviewRequest {

    @NotEmpty(message = "Danh sách sản phẩm không được để trống")
    private List<@NotNull(message = "Sản phẩm trong hóa đơn không được để trống") @Valid PosSaleItemRequest> items;

    @Size(max = 50, message = "Mã voucher không quá 50 ký tự")
    private String voucherCode;
}
