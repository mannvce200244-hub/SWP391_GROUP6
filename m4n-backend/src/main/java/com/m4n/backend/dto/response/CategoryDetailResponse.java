package com.m4n.backend.dto.response;

import java.time.Instant;

public record CategoryDetailResponse(
        Long id,
        String code,
        String name,
        String description,
        long productCount,
        Instant createdAt
) {}
