package com.m4n.backend.service;

import com.m4n.backend.dto.response.DashboardSummaryResponse;
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
}
