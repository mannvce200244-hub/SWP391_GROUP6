package com.m4n.backend.controller;

import com.m4n.backend.dto.response.DashboardSummaryResponse;
import com.m4n.backend.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/dashboard")
@RequiredArgsConstructor
@Tag(name = "Admin Dashboard", description = "Back-office analytics, revenue, order metrics and inventory overview")
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(summary = "Get admin dashboard metrics", description = "Returns aggregated revenue, orders, inventory status, trend series, and top selling products.")
    public ResponseEntity<DashboardSummaryResponse> getDashboard(
            @RequestParam(defaultValue = "month") String period
    ) {
        return ResponseEntity.ok(dashboardService.getDashboardSummary(period));
    }
}
