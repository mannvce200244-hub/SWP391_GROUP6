package com.m4n.backend.dto.request;

import jakarta.validation.constraints.NotNull;

public record UserStatusUpdateRequest(
        @NotNull(message = "Phiên bản dữ liệu (version) không được để trống")
        Long expectedVersion
) {}
