package com.m4n.backend.dto.response;

public record CraftVillageSummaryResponse(
        Long id,
        String name,
        String location,
        String description,
        String imageUrl
) {}
