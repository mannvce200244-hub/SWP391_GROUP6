package com.m4n.backend.service;

import com.m4n.backend.dto.response.DashboardSummaryResponse;
import com.m4n.backend.dto.response.RevenuePointResponse;
import com.m4n.backend.dto.response.TopProductResponse;
import com.m4n.backend.entity.Order;
import com.m4n.backend.entity.OrderStatus;
import com.m4n.backend.repository.InventoryRepository;
import com.m4n.backend.repository.InvoiceRepository;
import com.m4n.backend.repository.OrderItemRepository;
import com.m4n.backend.repository.OrderRepository;
import com.m4n.backend.service.serviceImpl.DashboardServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.domain.PageRequest;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneId;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class DashboardServiceTest {

    private static final ZoneId VN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private OrderItemRepository orderItemRepository;

    @Mock
    private InventoryRepository inventoryRepository;

    @Mock
    private InvoiceRepository invoiceRepository;

    private DashboardService dashboardService;

    @BeforeEach
    void setUp() {
        dashboardService = new DashboardServiceImpl(
                orderRepository,
                orderItemRepository,
                inventoryRepository,
                invoiceRepository
        );
    }

    @Test
    @DisplayName("getDashboardSummary should calculate unified metrics from online orders and POS invoices (BR-REVENUE-01)")
    void getDashboardSummary_calculatesMetricsCorrectly_adheringToBRRevenue01() {
        // Arrange
        when(orderRepository.sumFinalAmountByStatus(OrderStatus.COMPLETED))
                .thenReturn(new BigDecimal("21150000"));
        when(invoiceRepository.sumFinalAmount())
                .thenReturn(new BigDecimal("5000000")); // POS showroom revenue

        when(orderRepository.count()).thenReturn(7L);
        when(invoiceRepository.count()).thenReturn(2L); // 2 POS invoices
        when(orderRepository.countByStatus(OrderStatus.COMPLETED)).thenReturn(3L);
        when(orderRepository.countByStatus(OrderStatus.CANCELLED)).thenReturn(1L);

        when(inventoryRepository.sumTotalQuantity()).thenReturn(75L);
        when(inventoryRepository.countAvailableProducts()).thenReturn(4L);
        when(inventoryRepository.countLowStockProducts()).thenReturn(1L);
        when(inventoryRepository.countByQuantity(0)).thenReturn(0L);

        TopProductResponse topOnline = TopProductResponse.builder()
                .productId(1L)
                .productCode("TRN-001")
                .productName("Đàn Tranh 16 Dây")
                .categoryName("Nhạc cụ dây")
                .quantitySold(3L)
                .revenue(new BigDecimal("25500000"))
                .build();
        when(orderItemRepository.findTopSellingProductsAcrossChannels(eq(OrderStatus.COMPLETED), any(PageRequest.class)))
                .thenReturn(List.of(topOnline));

        Order recentOrder = Order.builder()
                .id(1L)
                .orderCode("M4N-2026-089")
                .customerName("Trần Hoài Nam")
                .finalAmount(new BigDecimal("8500000"))
                .status(OrderStatus.COMPLETED)
                .paymentMethod("Chuyển khoản QR Napas")
                .createdAt(Instant.now())
                .build();
        when(orderRepository.findTop5ByOrderByCreatedAtDesc())
                .thenReturn(List.of(recentOrder));

        // Act
        DashboardSummaryResponse response = dashboardService.getDashboardSummary("month");

        // Assert
        assertThat(response).isNotNull();
        assertThat(response.getPeriod()).isEqualTo("month");

        // Unified KPI asserts: 21,150,000 (online) + 5,000,000 (POS) = 26,150,000
        assertThat(response.getKpi().getTotalRevenue()).isEqualByComparingTo("26150000");
        // Total orders: 7 (online) + 2 (POS) = 9
        assertThat(response.getKpi().getTotalOrders()).isEqualTo(9L);
        // Completed orders: 3 (online) + 2 (POS) = 5
        assertThat(response.getKpi().getCompletedOrders()).isEqualTo(5L);
        assertThat(response.getKpi().getCancelledOrders()).isEqualTo(1L);

        // Inventory asserts
        assertThat(response.getInventory().getTotalItems()).isEqualTo(75L);
        assertThat(response.getInventory().getAvailableCount()).isEqualTo(4L);
        assertThat(response.getInventory().getLowStockCount()).isEqualTo(1L);
        assertThat(response.getInventory().getOutOfStockCount()).isEqualTo(0L);

        // Top products asserts: merged quantities: 2 + 1 = 3 sold
        assertThat(response.getTopProducts()).hasSize(1);
        assertThat(response.getTopProducts().getFirst().getProductCode()).isEqualTo("TRN-001");
        assertThat(response.getTopProducts().getFirst().getQuantitySold()).isEqualTo(3L);
        assertThat(response.getTopProducts().getFirst().getRevenue()).isEqualByComparingTo("25500000");

        // Recent orders asserts
        assertThat(response.getRecentOrders()).hasSize(1);
        assertThat(response.getRecentOrders().getFirst().getOrderCode()).isEqualTo("M4N-2026-089");
        assertThat(response.getRecentOrders().getFirst().getStatusLabel()).isEqualTo("Đã hoàn thành");

        // Revenue trend asserts
        assertThat(response.getRevenueTrend()).isNotEmpty();
    }

    @Test
    @DisplayName("BE-TEST-01: getDashboardSummary with 'month' period should aggregate 12 consecutive months")
    void getDashboardSummary_monthPeriod_aggregates12Months() {
        int year = 2026;
        YearMonth march = YearMonth.of(year, 3);
        Instant marchStart = march.atDay(1).atStartOfDay(VN_ZONE).toInstant();
        Instant marchEnd = march.plusMonths(1).atDay(1).atStartOfDay(VN_ZONE).toInstant();

        when(orderRepository.sumFinalAmountByStatusAndCompletedAtBetween(OrderStatus.COMPLETED, marchStart, marchEnd))
                .thenReturn(new BigDecimal("12000000"));
        when(invoiceRepository.sumFinalAmountByCreatedAtBetween(marchStart, marchEnd))
                .thenReturn(new BigDecimal("3000000"));
        when(orderRepository.countByCreatedAtGreaterThanEqualAndCreatedAtLessThan(marchStart, marchEnd))
                .thenReturn(4L);
        when(invoiceRepository.countByCreatedAtGreaterThanEqualAndCreatedAtLessThan(marchStart, marchEnd))
                .thenReturn(1L);

        DashboardSummaryResponse response = dashboardService.getDashboardSummary("month", year);

        assertThat(response).isNotNull();
        assertThat(response.getPeriod()).isEqualTo("month");
        List<RevenuePointResponse> trend = response.getRevenueTrend();
        assertThat(trend).hasSize(12);

        // Check labels "Tháng 1" through "Tháng 12"
        for (int m = 1; m <= 12; m++) {
            assertThat(trend.get(m - 1).getLabel()).isEqualTo("Tháng " + m);
        }

        // March (index 2): online (12,000,000) + POS (3,000,000) = 15,000,000; orders = 4 + 1 = 5
        RevenuePointResponse marchPoint = trend.get(2);
        assertThat(marchPoint.getRevenue()).isEqualByComparingTo("15000000");
        assertThat(marchPoint.getOrderCount()).isEqualTo(5L);

        // January (index 0) has 0 revenue and 0 orders (unstubbed)
        RevenuePointResponse janPoint = trend.getFirst();
        assertThat(janPoint.getRevenue()).isEqualByComparingTo("0");
        assertThat(janPoint.getOrderCount()).isEqualTo(0L);
    }

    @Test
    @DisplayName("BE-TEST-02: getDashboardSummary with 'quarter' period should aggregate 4 quarters")
    void getDashboardSummary_quarterPeriod_aggregates4Quarters() {
        int year = 2026;
        // Q2: April 1 to July 1 (start of Q3)
        Instant q2Start = LocalDate.of(year, 4, 1).atStartOfDay(VN_ZONE).toInstant();
        Instant q2End = LocalDate.of(year, 7, 1).atStartOfDay(VN_ZONE).toInstant();

        when(orderRepository.sumFinalAmountByStatusAndCompletedAtBetween(OrderStatus.COMPLETED, q2Start, q2End))
                .thenReturn(new BigDecimal("40000000"));
        when(invoiceRepository.sumFinalAmountByCreatedAtBetween(q2Start, q2End))
                .thenReturn(new BigDecimal("10000000"));
        when(orderRepository.countByCreatedAtGreaterThanEqualAndCreatedAtLessThan(q2Start, q2End))
                .thenReturn(8L);
        when(invoiceRepository.countByCreatedAtGreaterThanEqualAndCreatedAtLessThan(q2Start, q2End))
                .thenReturn(2L);

        DashboardSummaryResponse response = dashboardService.getDashboardSummary("quarter", year);

        assertThat(response).isNotNull();
        assertThat(response.getPeriod()).isEqualTo("quarter");
        List<RevenuePointResponse> trend = response.getRevenueTrend();
        assertThat(trend).hasSize(4);

        assertThat(trend.get(0).getLabel()).isEqualTo("Quý 1");
        assertThat(trend.get(1).getLabel()).isEqualTo("Quý 2");
        assertThat(trend.get(2).getLabel()).isEqualTo("Quý 3");
        assertThat(trend.get(3).getLabel()).isEqualTo("Quý 4");

        // Q2 (index 1): 40M + 10M = 50M; count: 8 + 2 = 10
        RevenuePointResponse q2Point = trend.get(1);
        assertThat(q2Point.getRevenue()).isEqualByComparingTo("50000000");
        assertThat(q2Point.getOrderCount()).isEqualTo(10L);
    }

    @Test
    @DisplayName("BE-TEST-03: getDashboardSummary with 'day' period should aggregate last 7 days")
    void getDashboardSummary_dayPeriod_aggregatesLast7Days() {
        int year = 2025; // deterministic base date = 2025-12-31
        LocalDate lastDay = LocalDate.of(year, 12, 31);
        Instant lastDayStart = lastDay.atStartOfDay(VN_ZONE).toInstant();
        Instant lastDayEnd = lastDay.plusDays(1).atStartOfDay(VN_ZONE).toInstant();

        when(orderRepository.sumFinalAmountByStatusAndCompletedAtBetween(OrderStatus.COMPLETED, lastDayStart, lastDayEnd))
                .thenReturn(new BigDecimal("2500000"));
        when(invoiceRepository.sumFinalAmountByCreatedAtBetween(lastDayStart, lastDayEnd))
                .thenReturn(new BigDecimal("500000"));

        DashboardSummaryResponse response = dashboardService.getDashboardSummary("day", year);

        assertThat(response).isNotNull();
        assertThat(response.getPeriod()).isEqualTo("day");
        List<RevenuePointResponse> trend = response.getRevenueTrend();
        assertThat(trend).hasSize(7);

        // Labels format is dd/MM
        for (RevenuePointResponse point : trend) {
            assertThat(point.getLabel()).matches("\\d{2}/\\d{2}");
        }

        assertThat(trend.getFirst().getLabel()).isEqualTo("25/12");
        assertThat(trend.getLast().getLabel()).isEqualTo("31/12");
        assertThat(trend.getLast().getRevenue()).isEqualByComparingTo("3000000");
    }

    @Test
    @DisplayName("BE-TEST-04: getDashboardSummary with 'year' period should aggregate multi-year trend")
    void getDashboardSummary_yearPeriod_aggregatesMultiYears() {
        int year = 2026;
        // Range: Math.max(2020, 2026 - 4) = 2022 to 2026 (5 years: 2022, 2023, 2024, 2025, 2026)
        Instant y2025Start = LocalDate.of(2025, 1, 1).atStartOfDay(VN_ZONE).toInstant();
        Instant y2025End = LocalDate.of(2026, 1, 1).atStartOfDay(VN_ZONE).toInstant();

        when(orderRepository.sumFinalAmountByStatusAndCompletedAtBetween(OrderStatus.COMPLETED, y2025Start, y2025End))
                .thenReturn(new BigDecimal("150000000"));
        when(invoiceRepository.sumFinalAmountByCreatedAtBetween(y2025Start, y2025End))
                .thenReturn(new BigDecimal("50000000"));
        when(orderRepository.countByCreatedAtGreaterThanEqualAndCreatedAtLessThan(y2025Start, y2025End))
                .thenReturn(40L);
        when(invoiceRepository.countByCreatedAtGreaterThanEqualAndCreatedAtLessThan(y2025Start, y2025End))
                .thenReturn(10L);

        DashboardSummaryResponse response = dashboardService.getDashboardSummary("year", year);

        assertThat(response).isNotNull();
        assertThat(response.getPeriod()).isEqualTo("year");
        List<RevenuePointResponse> trend = response.getRevenueTrend();
        assertThat(trend).hasSize(5);

        List<String> labels = trend.stream().map(RevenuePointResponse::getLabel).toList();
        assertThat(labels).containsExactly("Năm 2022", "Năm 2023", "Năm 2024", "Năm 2025", "Năm 2026");

        // Year 2025 (index 3): 150M + 50M = 200M; count: 40 + 10 = 50
        RevenuePointResponse y2025Point = trend.get(3);
        assertThat(y2025Point.getRevenue()).isEqualByComparingTo("200000000");
        assertThat(y2025Point.getOrderCount()).isEqualTo(50L);
    }

    @Test
    @DisplayName("BE-TEST-05: getDashboardSummary status filtering strictly excludes non-completed orders")
    void getDashboardSummary_statusFiltering_excludesNonCompletedOrders() {
        when(orderRepository.sumFinalAmountByStatus(OrderStatus.COMPLETED)).thenReturn(new BigDecimal("50000000"));
        when(invoiceRepository.sumFinalAmount()).thenReturn(BigDecimal.ZERO);
        when(orderRepository.countByStatus(OrderStatus.COMPLETED)).thenReturn(10L);
        when(orderRepository.countByStatus(OrderStatus.CANCELLED)).thenReturn(2L);

        DashboardSummaryResponse response = dashboardService.getDashboardSummary("month", 2026);

        assertThat(response.getKpi().getTotalRevenue()).isEqualByComparingTo("50000000");
        assertThat(response.getKpi().getCompletedOrders()).isEqualTo(10L);
        assertThat(response.getKpi().getCancelledOrders()).isEqualTo(2L);

        // Verify strictly queries OrderStatus.COMPLETED for online revenue
        verify(orderRepository).sumFinalAmountByStatus(OrderStatus.COMPLETED);
        verify(orderRepository, never()).sumFinalAmountByStatus(OrderStatus.CANCELLED);
        verify(orderRepository, never()).sumFinalAmountByStatus(OrderStatus.PENDING_CONFIRMATION);
        verify(orderRepository, never()).sumFinalAmountByStatus(OrderStatus.CONFIRMED);
        verify(orderRepository, never()).sumFinalAmountByStatus(OrderStatus.SHIPPING);
        verify(orderRepository, never()).sumFinalAmountByStatus(OrderStatus.DELIVERED);
    }

    @Test
    @DisplayName("BE-TEST-06: getDashboardSummary correctly handles leap year February with 29 days")
    void getDashboardSummary_leapYear_handlesFebruaryCorrectly() {
        int leapYear = 2024;
        Instant febStart = LocalDate.of(leapYear, 2, 1).atStartOfDay(VN_ZONE).toInstant();
        Instant febEnd = LocalDate.of(leapYear, 3, 1).atStartOfDay(VN_ZONE).toInstant();

        // 2024 is a leap year; duration between febStart and febEnd must be exactly 29 days
        long daysInFeb = Duration.between(febStart, febEnd).toDays();
        assertThat(daysInFeb).isEqualTo(29L);

        when(orderRepository.sumFinalAmountByStatusAndCompletedAtBetween(OrderStatus.COMPLETED, febStart, febEnd))
                .thenReturn(new BigDecimal("29000000"));

        DashboardSummaryResponse response = dashboardService.getDashboardSummary("month", leapYear);

        RevenuePointResponse febPoint = response.getRevenueTrend().get(1); // February is index 1
        assertThat(febPoint.getLabel()).isEqualTo("Tháng 2");
        assertThat(febPoint.getRevenue()).isEqualByComparingTo("29000000");

        verify(orderRepository).sumFinalAmountByStatusAndCompletedAtBetween(OrderStatus.COMPLETED, febStart, febEnd);
    }

    @Test
    @DisplayName("BE-TEST-07: getDashboardSummary timezone handling matches Vietnam UTC+7 offset")
    void getDashboardSummary_timezoneHandling_vietnamZoneUtcOffset() {
        int year = 2026;
        // January 1, 2026 00:00:00 in Asia/Ho_Chi_Minh corresponds to 2025-12-31 17:00:00 UTC
        Instant expectedJanStart = LocalDate.of(year, 1, 1).atStartOfDay(VN_ZONE).toInstant();
        assertThat(expectedJanStart).isEqualTo(Instant.parse("2025-12-31T17:00:00Z"));

        // February 1, 2026 00:00:00 in Asia/Ho_Chi_Minh corresponds to 2026-01-31 17:00:00 UTC
        Instant expectedFebStart = LocalDate.of(year, 2, 1).atStartOfDay(VN_ZONE).toInstant();
        assertThat(expectedFebStart).isEqualTo(Instant.parse("2026-01-31T17:00:00Z"));

        when(orderRepository.sumFinalAmountByStatusAndCompletedAtBetween(OrderStatus.COMPLETED, expectedJanStart, expectedFebStart))
                .thenReturn(new BigDecimal("10000000"));

        DashboardSummaryResponse response = dashboardService.getDashboardSummary("month", year);

        RevenuePointResponse janPoint = response.getRevenueTrend().getFirst();
        assertThat(janPoint.getLabel()).isEqualTo("Tháng 1");
        assertThat(janPoint.getRevenue()).isEqualByComparingTo("10000000");
    }

    @Test
    @DisplayName("BE-TEST-08: getDashboardSummary handles null amounts and empty database safely")
    void getDashboardSummary_nullSafetyAndEmptyDatabase() {
        // All sum queries return null; all counts return 0 (default Mockito behavior)
        DashboardSummaryResponse response = dashboardService.getDashboardSummary("month", 2026);

        assertThat(response).isNotNull();
        assertThat(response.getPeriod()).isEqualTo("month");

        // KPI defaults to 0 and BigDecimal.ZERO
        assertThat(response.getKpi().getTotalRevenue()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(response.getKpi().getTotalOrders()).isEqualTo(0L);
        assertThat(response.getKpi().getCompletedOrders()).isEqualTo(0L);
        assertThat(response.getKpi().getCancelledOrders()).isEqualTo(0L);

        // Inventory defaults to 0
        assertThat(response.getInventory().getTotalItems()).isEqualTo(0L);
        assertThat(response.getInventory().getAvailableCount()).isEqualTo(0L);
        assertThat(response.getInventory().getLowStockCount()).isEqualTo(0L);
        assertThat(response.getInventory().getOutOfStockCount()).isEqualTo(0L);

        // Trend points all have 0 revenue and 0 orders
        assertThat(response.getRevenueTrend()).hasSize(12);
        for (RevenuePointResponse point : response.getRevenueTrend()) {
            assertThat(point.getRevenue()).isEqualByComparingTo(BigDecimal.ZERO);
            assertThat(point.getOrderCount()).isEqualTo(0L);
        }

        // Top products and recent orders are empty
        assertThat(response.getTopProducts()).isEmpty();
        assertThat(response.getRecentOrders()).isEmpty();
    }
}
