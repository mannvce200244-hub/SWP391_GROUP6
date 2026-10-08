package com.m4n.backend.service;

import com.m4n.backend.dto.response.DashboardSummaryResponse;
import com.m4n.backend.dto.response.TopProductResponse;
import com.m4n.backend.entity.Order;
import com.m4n.backend.entity.OrderStatus;
import com.m4n.backend.repository.InventoryRepository;
import com.m4n.backend.repository.OrderItemRepository;
import com.m4n.backend.repository.OrderRepository;
import com.m4n.backend.serviceImpl.DashboardServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DashboardServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private OrderItemRepository orderItemRepository;

    @Mock
    private InventoryRepository inventoryRepository;

    private DashboardService dashboardService;

    @BeforeEach
    void setUp() {
        dashboardService = new DashboardServiceImpl(orderRepository, orderItemRepository, inventoryRepository);
    }

    @Test
    void getDashboardSummary_calculatesMetricsCorrectly_adheringToBRRevenue01() {
        // Arrange
        when(orderRepository.sumFinalAmountByStatus(OrderStatus.COMPLETED))
                .thenReturn(new BigDecimal("21150000"));
        when(orderRepository.count()).thenReturn(7L);
        when(orderRepository.countByStatus(OrderStatus.COMPLETED)).thenReturn(3L);
        when(orderRepository.countByStatus(OrderStatus.CANCELLED)).thenReturn(1L);

        when(inventoryRepository.sumTotalQuantity()).thenReturn(75L);
        when(inventoryRepository.countByQuantityGreaterThan(5)).thenReturn(4L);
        when(inventoryRepository.countByQuantityBetween(1, 5)).thenReturn(1L);
        when(inventoryRepository.countByQuantity(0)).thenReturn(0L);

        TopProductResponse topProduct = TopProductResponse.builder()
                .productId(1L)
                .productCode("TRN-001")
                .productName("Đàn Tranh 16 Dây")
                .categoryName("Nhạc cụ dây")
                .quantitySold(2L)
                .revenue(new BigDecimal("17000000"))
                .build();
        when(orderItemRepository.findTopSellingProducts(eq(OrderStatus.COMPLETED), any(PageRequest.class)))
                .thenReturn(List.of(topProduct));

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

        // KPI asserts
        assertThat(response.getKpi().getTotalRevenue()).isEqualByComparingTo("21150000");
        assertThat(response.getKpi().getTotalOrders()).isEqualTo(7L);
        assertThat(response.getKpi().getCompletedOrders()).isEqualTo(3L);
        assertThat(response.getKpi().getCancelledOrders()).isEqualTo(1L);

        // Inventory asserts
        assertThat(response.getInventory().getTotalItems()).isEqualTo(75L);
        assertThat(response.getInventory().getAvailableCount()).isEqualTo(4L);
        assertThat(response.getInventory().getLowStockCount()).isEqualTo(1L);
        assertThat(response.getInventory().getOutOfStockCount()).isEqualTo(0L);

        // Top products asserts
        assertThat(response.getTopProducts()).hasSize(1);
        assertThat(response.getTopProducts().get(0).getProductCode()).isEqualTo("TRN-001");

        // Recent orders asserts
        assertThat(response.getRecentOrders()).hasSize(1);
        assertThat(response.getRecentOrders().get(0).getOrderCode()).isEqualTo("M4N-2026-089");
        assertThat(response.getRecentOrders().get(0).getStatusLabel()).isEqualTo("Đã hoàn thành");

        // Revenue trend asserts
        assertThat(response.getRevenueTrend()).isNotEmpty();
    }
}
