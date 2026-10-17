package com.m4n.backend.dto.response;

import java.time.Instant;

public record ArtisanDetailResponse(
        Long id,
        String name,
        String biography,
        String avatarUrl,
        Long craftVillageId,
        String craftVillageName,
        long productCount,
        Instant createdAt
) {}
