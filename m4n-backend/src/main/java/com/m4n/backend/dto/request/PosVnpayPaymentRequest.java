package com.m4n.backend.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record PosVnpayPaymentRequest(
        @NotBlank @Pattern(regexp = "pos-[0-9a-f]{32}") String id,
        @NotNull @Valid PosSaleRequest sale,
        @Email @Size(max = 255) String customerEmail,
        @NotNull @DecimalMin("5000") @DecimalMax("9999999999") @Digits(integer = 10, fraction = 0) BigDecimal expectedAmount) {}

