package com.m4n.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardSummaryResponse {

    private String period;
    private KpiSummary kpi;
    private InventorySummaryResponse inventory;
    private List<RevenuePointResponse> revenueTrend;
    private List<TopProductResponse> topProducts;
    private List<RecentOrderResponse> recentOrders;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class KpiSummary {
        private BigDecimal totalRevenue;
        private Long totalOrders;
        private Long completedOrders;
        private Long cancelledOrders;
    }
}
