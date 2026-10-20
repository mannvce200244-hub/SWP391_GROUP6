package com.m4n.backend.dto.response;

public record ArtisanSummaryResponse(
        Long id,
        String name,
        String biography,
        String avatarUrl
) {}
