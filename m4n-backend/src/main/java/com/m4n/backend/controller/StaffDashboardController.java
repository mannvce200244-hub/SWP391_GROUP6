package com.m4n.backend.controller;

import com.m4n.backend.dto.response.StaffDashboardSummaryResponse;
import com.m4n.backend.entity.OrderStatus;
import com.m4n.backend.service.StaffDashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/staff/dashboard")
@RequiredArgsConstructor
@Tag(name = "Staff Dashboard", description = "Operational workload summary for Online Staff")
@SecurityRequirement(name = "bearerAuth")
public class StaffDashboardController {

    private final StaffDashboardService staffDashboardService;

    @GetMapping
    @PreAuthorize("hasRole('ONLINE_STAFF')")
    @Operation(summary = "Get Online Staff dashboard metrics")
    public ResponseEntity<StaffDashboardSummaryResponse> getDashboard(
            Authentication authentication,
            @RequestParam(defaultValue = "7") int days,
            @RequestParam(required = false) OrderStatus status
    ) {
        return ResponseEntity.ok(
                staffDashboardService.getDashboardSummary(authentication.getName(), days, status)
        );
    }
}
