package com.m4n.backend.dto.response;

public record ProductMediaResponse(
        Long id,
        String type,
        String url,
        String alt,
        Integer sortOrder
) {}
