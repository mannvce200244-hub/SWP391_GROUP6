package com.m4n.backend.service;

import com.m4n.backend.dto.response.DashboardSummaryResponse;

public interface DashboardService {
    DashboardSummaryResponse getDashboardSummary(String period);
}
