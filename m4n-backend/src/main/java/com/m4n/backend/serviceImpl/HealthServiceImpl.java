package com.m4n.backend.serviceImpl;

import com.m4n.backend.dto.response.HealthResponse;
import com.m4n.backend.service.HealthService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
public class HealthServiceImpl implements HealthService {

    private final String appName;

    public HealthServiceImpl(@Value("${spring.application.name:m4n-backend}") String appName) {
        this.appName = appName;
    }

    @Override
    public HealthResponse getHealthStatus() {
        return new HealthResponse(
                "UP",
                appName,
                "v1",
                Instant.now()
        );
    }
}
