package com.m4n.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StaffDashboardSummaryResponse {

    private KpiSummary kpi;
    private List<OrderTrendPoint> orderTrend;
    private List<OrderStatusCount> orderStatusCounts;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class KpiSummary {
        private Long pendingOrders;
        private Long confirmedOrders;
        private Long waitingConversations;
        private Long unreadMessages;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class OrderTrendPoint {
        private LocalDate date;
        private Long orderCount;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class OrderStatusCount {
        private String status;
        private String label;
        private Long count;
    }
}
