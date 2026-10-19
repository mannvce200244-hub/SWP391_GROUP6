package com.m4n.backend.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
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
    @Valid
    private List<PosSaleItemRequest> items;

    private String voucherCode;
}
