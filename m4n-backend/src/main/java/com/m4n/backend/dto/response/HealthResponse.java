package com.m4n.backend.dto.response;

import java.time.Instant;

public record HealthResponse(
        String status,
        String appName,
        String version,
        Instant timestamp
) {}
