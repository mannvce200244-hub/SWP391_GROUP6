package com.m4n.backend.service;

import com.m4n.backend.dto.response.StaffDashboardSummaryResponse;
import com.m4n.backend.entity.OrderStatus;

public interface StaffDashboardService {

    StaffDashboardSummaryResponse getDashboardSummary(String staffEmail, int days, OrderStatus status);
}
