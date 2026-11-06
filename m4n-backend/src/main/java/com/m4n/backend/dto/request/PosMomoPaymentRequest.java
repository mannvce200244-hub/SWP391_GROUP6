package com.m4n.backend.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

public record PosMomoPaymentRequest(
        @NotBlank @Pattern(regexp = "pos-[0-9a-f]{32}") String id,
        @NotNull @Valid PosSaleRequest sale,
        @NotBlank @Email @Size(max = 255) String customerEmail,
        @NotNull @DecimalMin("1000") @Digits(integer = 8, fraction = 0) java.math.BigDecimal expectedAmount) {}
