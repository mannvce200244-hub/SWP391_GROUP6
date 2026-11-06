package com.m4n.backend.dto.request;

import jakarta.validation.constraints.NotNull;

public record ProductStatusUpdateRequest(
        @NotNull(message = "Trạng thái kích hoạt không được để trống")
        Boolean isActive
) {}
