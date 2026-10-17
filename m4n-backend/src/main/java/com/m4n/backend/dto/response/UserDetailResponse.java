package com.m4n.backend.dto.response;

import com.m4n.backend.entity.RoleName;

import java.time.Instant;

public record UserDetailResponse(
        Long id,
        String email,
        String fullName,
        String phone,
        String address,
        RoleName role,
        boolean isActive,
        Instant createdAt,
        Instant updatedAt,
        Long version
) {}
