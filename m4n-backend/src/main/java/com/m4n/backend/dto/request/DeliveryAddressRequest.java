package com.m4n.backend.dto.request;
import jakarta.validation.constraints.*;

public record DeliveryAddressRequest(@NotNull @Positive Integer provinceId, @NotNull @Positive Integer wardId,
        @NotBlank @Size(max = 200) String streetAddress) {}
