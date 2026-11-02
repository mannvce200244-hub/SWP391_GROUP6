package com.m4n.backend.dto.response;

import java.util.List;

public record ReviewPageResponse(
        List<ReviewResponse> content,
        int number,
        int size,
        long totalElements,
        int totalPages,
        Double averageRating
) {
}
