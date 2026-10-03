package com.m4n.backend.controller;

import com.m4n.backend.dto.response.HealthResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;

@RestController
@RequestMapping("/api/v1/health")
@Tag(name = "System", description = "System health and infrastructure verification APIs")
public class HealthController {

    private final String appName;

    public HealthController(@Value("${spring.application.name:m4n-backend}") String appName) {
        this.appName = appName;
    }

    @GetMapping
    @Operation(summary = "Check backend system health", description = "Returns the status of the M4N backend service and timestamp")
    public ResponseEntity<HealthResponse> getHealth() {
        HealthResponse response = new HealthResponse(
                "UP",
                appName,
                "v1",
                Instant.now()
        );
        return ResponseEntity.ok(response);
    }
}
