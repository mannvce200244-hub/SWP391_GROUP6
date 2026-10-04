package com.m4n.backend.dto.response;

import com.m4n.backend.entity.RoleName;

public record UserResponse(
        Long id,
        String email,
        String fullName,
        String phone,
        String address,
        RoleName role,
        boolean isActive
) {}
