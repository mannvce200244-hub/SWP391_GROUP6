package com.m4n.backend.dto.request;

import com.m4n.backend.entity.RoleName;
import jakarta.validation.constraints.NotNull;

public record ChangeUserRoleRequest(
        @NotNull(message = "Vai trò mới không được để trống")
        RoleName newRole,

        @NotNull(message = "Phiên bản dữ liệu (version) không được để trống")
        Long expectedVersion
) {}
