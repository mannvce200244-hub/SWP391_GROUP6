package com.m4n.backend.dto.response;

import java.time.Instant;

public record CraftVillageDetailResponse(
        Long id,
        String name,
        String location,
        String description,
        String imageUrl,
        long artisanCount,
        long productCount,
        Instant createdAt
) {}
