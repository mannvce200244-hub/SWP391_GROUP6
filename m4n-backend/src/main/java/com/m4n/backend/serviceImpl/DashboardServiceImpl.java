package com.m4n.backend.serviceImpl;

import com.m4n.backend.dto.response.DashboardSummaryResponse;
import com.m4n.backend.dto.response.InventorySummaryResponse;
import com.m4n.backend.dto.response.RecentOrderResponse;
import com.m4n.backend.dto.response.RevenuePointResponse;
import com.m4n.backend.dto.response.TopProductResponse;
import com.m4n.backend.entity.Order;
import com.m4n.backend.entity.OrderStatus;
import com.m4n.backend.repository.InventoryRepository;
import com.m4n.backend.repository.OrderItemRepository;
import com.m4n.backend.repository.OrderRepository;
import com.m4n.backend.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.YearMonth;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardServiceImpl implements DashboardService {

    private static final ZoneId VN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final InventoryRepository inventoryRepository;

    @Override
    public DashboardSummaryResponse getDashboardSummary(String period) {
        String normalizedPeriod = (period == null || period.trim().isEmpty())
                ? "month"
                : period.trim().toLowerCase();

        // 1. KPI Cards (authoritative database aggregation per BR-REVENUE-01)
        BigDecimal totalRevenue = orderRepository.sumFinalAmountByStatus(OrderStatus.COMPLETED);
        long totalOrders = orderRepository.count();
        long completedOrders = orderRepository.countByStatus(OrderStatus.COMPLETED);
        long cancelledOrders = orderRepository.countByStatus(OrderStatus.CANCELLED);

        DashboardSummaryResponse.KpiSummary kpi = DashboardSummaryResponse.KpiSummary.builder()
                .totalRevenue(totalRevenue != null ? totalRevenue : BigDecimal.ZERO)
                .totalOrders(totalOrders)
                .completedOrders(completedOrders)
                .cancelledOrders(cancelledOrders)
                .build();

        // 2. Inventory Status
        long totalInventory = inventoryRepository.sumTotalQuantity();
        long availableCount = inventoryRepository.countByQuantityGreaterThan(5);
        long lowStockCount = inventoryRepository.countByQuantityBetween(1, 5);
        long outOfStockCount = inventoryRepository.countByQuantity(0);

        InventorySummaryResponse inventory = InventorySummaryResponse.builder()
                .totalItems(totalInventory)
                .availableCount(availableCount)
                .lowStockCount(lowStockCount)
                .outOfStockCount(outOfStockCount)
                .build();

        // 3. Revenue Trend by period
        List<RevenuePointResponse> revenueTrend = calculateRevenueTrend(normalizedPeriod);

        // 4. Best-selling Products (top 5)
        List<TopProductResponse> topProducts = orderItemRepository.findTopSellingProducts(
                OrderStatus.COMPLETED,
                PageRequest.of(0, 5)
        );

        // 5. Recent Orders (top 5)
        List<Order> recentOrderEntities = orderRepository.findTop5ByOrderByCreatedAtDesc();
        List<RecentOrderResponse> recentOrders = recentOrderEntities.stream()
                .map(this::mapToRecentOrderResponse)
                .toList();

        return DashboardSummaryResponse.builder()
                .period(normalizedPeriod)
                .kpi(kpi)
                .inventory(inventory)
                .revenueTrend(revenueTrend)
                .topProducts(topProducts)
                .recentOrders(recentOrders)
                .build();
    }

    private List<RevenuePointResponse> calculateRevenueTrend(String period) {
        LocalDate today = LocalDate.now(VN_ZONE);
        List<RevenuePointResponse> points = new ArrayList<>();

        switch (period) {
            case "day" -> {
                // Last 7 days
                for (int i = 6; i >= 0; i--) {
                    LocalDate date = today.minusDays(i);
                    Instant start = date.atStartOfDay(VN_ZONE).toInstant();
                    Instant end = date.atTime(LocalTime.MAX).atZone(VN_ZONE).toInstant();

                    BigDecimal rev = orderRepository.sumFinalAmountByStatusAndCreatedAtBetween(OrderStatus.COMPLETED, start, end);
                    long count = orderRepository.countByCreatedAtBetween(start, end);

                    String label = date.format(DateTimeFormatter.ofPattern("dd/MM"));
                    points.add(new RevenuePointResponse(label, rev != null ? rev : BigDecimal.ZERO, count));
                }
            }
            case "week" -> {
                // Last 4 weeks
                LocalDate startOfWeek = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
                for (int i = 3; i >= 0; i--) {
                    LocalDate weekStart = startOfWeek.minusWeeks(i);
                    LocalDate weekEnd = weekStart.plusDays(6);
                    Instant start = weekStart.atStartOfDay(VN_ZONE).toInstant();
                    Instant end = weekEnd.atTime(LocalTime.MAX).atZone(VN_ZONE).toInstant();

                    BigDecimal rev = orderRepository.sumFinalAmountByStatusAndCreatedAtBetween(OrderStatus.COMPLETED, start, end);
                    long count = orderRepository.countByCreatedAtBetween(start, end);

                    String label = "Tuần " + (4 - i);
                    points.add(new RevenuePointResponse(label, rev != null ? rev : BigDecimal.ZERO, count));
                }
            }
            case "quarter" -> {
                // 4 Quarters of current year
                int year = today.getYear();
                for (int q = 1; q <= 4; q++) {
                    int startMonth = (q - 1) * 3 + 1;
                    int endMonth = startMonth + 2;
                    LocalDate qStart = LocalDate.of(year, startMonth, 1);
                    LocalDate qEnd = YearMonth.of(year, endMonth).atEndOfMonth();

                    Instant start = qStart.atStartOfDay(VN_ZONE).toInstant();
                    Instant end = qEnd.atTime(LocalTime.MAX).atZone(VN_ZONE).toInstant();

                    BigDecimal rev = orderRepository.sumFinalAmountByStatusAndCreatedAtBetween(OrderStatus.COMPLETED, start, end);
                    long count = orderRepository.countByCreatedAtBetween(start, end);

                    String label = "Quý " + q;
                    points.add(new RevenuePointResponse(label, rev != null ? rev : BigDecimal.ZERO, count));
                }
            }
            default -> {
                // "month": 6 recent months
                for (int i = 5; i >= 0; i--) {
                    YearMonth ym = YearMonth.from(today).minusMonths(i);
                    Instant start = ym.atDay(1).atStartOfDay(VN_ZONE).toInstant();
                    Instant end = ym.atEndOfMonth().atTime(LocalTime.MAX).atZone(VN_ZONE).toInstant();

                    BigDecimal rev = orderRepository.sumFinalAmountByStatusAndCreatedAtBetween(OrderStatus.COMPLETED, start, end);
                    long count = orderRepository.countByCreatedAtBetween(start, end);

                    String label = "Tháng " + ym.getMonthValue();
                    points.add(new RevenuePointResponse(label, rev != null ? rev : BigDecimal.ZERO, count));
                }
            }
        }

        return points;
    }

    private RecentOrderResponse mapToRecentOrderResponse(Order order) {
        String statusLabel = switch (order.getStatus()) {
            case PENDING_CONFIRMATION -> "Chờ xác nhận";
            case CONFIRMED -> "Đã xác nhận";
            case OUT_OF_STOCK_WAITING -> "Chờ bổ sung kho";
            case COMPLETED -> "Đã hoàn thành";
            case CANCELLED -> "Đã hủy";
        };

        return RecentOrderResponse.builder()
                .id(order.getId())
                .orderCode(order.getOrderCode())
                .customerName(order.getCustomerName())
                .finalAmount(order.getFinalAmount())
                .status(order.getStatus().name())
                .statusLabel(statusLabel)
                .paymentMethod(order.getPaymentMethod())
                .createdAt(order.getCreatedAt())
                .build();
    }
}
