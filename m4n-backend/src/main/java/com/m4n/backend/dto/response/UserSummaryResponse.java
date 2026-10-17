package com.m4n.backend.dto.response;

import com.m4n.backend.entity.RoleName;

import java.time.Instant;

public record UserSummaryResponse(
        Long id,
        String email,
        String fullName,
        String phone,
        RoleName role,
        boolean isActive,
        Instant createdAt,
        Long version
) {}
