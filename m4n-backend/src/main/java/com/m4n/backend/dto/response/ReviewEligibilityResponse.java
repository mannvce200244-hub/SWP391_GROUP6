package com.m4n.backend.dto.response;

public record ReviewEligibilityResponse(
        boolean eligible,
        Long eligibleOrderId,
        String message
) {
}
