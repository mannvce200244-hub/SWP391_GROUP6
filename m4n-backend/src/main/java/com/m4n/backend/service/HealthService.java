package com.m4n.backend.service;

import com.m4n.backend.dto.response.HealthResponse;

public interface HealthService {

    HealthResponse getHealthStatus();
}
