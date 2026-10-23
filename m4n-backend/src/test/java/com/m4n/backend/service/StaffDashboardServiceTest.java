package com.m4n.backend.service;

import com.m4n.backend.dto.response.StaffDashboardSummaryResponse;
import com.m4n.backend.entity.ConversationStatus;
import com.m4n.backend.entity.OrderStatus;
import com.m4n.backend.entity.User;
import com.m4n.backend.repository.ChatMessageRepository;
import com.m4n.backend.repository.ConversationRepository;
import com.m4n.backend.repository.OrderRepository;
import com.m4n.backend.repository.UserRepository;
import com.m4n.backend.serviceImpl.StaffDashboardServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StaffDashboardServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private ConversationRepository conversationRepository;

    @Mock
    private ChatMessageRepository chatMessageRepository;

    @Mock
    private UserRepository userRepository;

    private StaffDashboardService staffDashboardService;

    @BeforeEach
    void setUp() {
        staffDashboardService = new StaffDashboardServiceImpl(
                orderRepository,
                conversationRepository,
                chatMessageRepository,
                userRepository
        );
    }

    @Test
    void getDashboardSummary_shouldReturnStaffScopedOperationalData() {
        User staff = User.builder().id(42L).email("staff@m4n.vn").build();
        when(userRepository.findByEmailIgnoreCase("staff@m4n.vn")).thenReturn(Optional.of(staff));
        when(orderRepository.countByStatus(OrderStatus.PENDING_CONFIRMATION)).thenReturn(4L);
        when(orderRepository.countByStatus(OrderStatus.CONFIRMED)).thenReturn(3L);
        when(orderRepository.countByStatus(OrderStatus.OUT_OF_STOCK_WAITING)).thenReturn(1L);
        when(orderRepository.countByStatus(OrderStatus.SHIPPING)).thenReturn(2L);
        when(orderRepository.countByStatus(OrderStatus.DELIVERED)).thenReturn(1L);
        when(orderRepository.countByStatus(OrderStatus.COMPLETED)).thenReturn(12L);
        when(orderRepository.countByStatus(OrderStatus.CANCELLED)).thenReturn(2L);
        when(orderRepository.countByCreatedAtBetween(any(Instant.class), any(Instant.class))).thenReturn(2L);
        when(conversationRepository.countByStatusAndAssignedStaffIsNull(ConversationStatus.OPEN)).thenReturn(5L);
        when(chatMessageRepository.countUnreadAssignedToStaff(ConversationStatus.OPEN, 42L)).thenReturn(7L);

        StaffDashboardSummaryResponse response = staffDashboardService.getDashboardSummary(
                "staff@m4n.vn",
                7,
                null
        );

        assertThat(response.getKpi().getPendingOrders()).isEqualTo(4L);
        assertThat(response.getKpi().getConfirmedOrders()).isEqualTo(3L);
        assertThat(response.getKpi().getWaitingConversations()).isEqualTo(5L);
        assertThat(response.getKpi().getUnreadMessages()).isEqualTo(7L);
        assertThat(response.getOrderTrend()).hasSize(7);
        assertThat(response.getOrderTrend()).allSatisfy(point -> assertThat(point.getOrderCount()).isEqualTo(2L));
        assertThat(response.getOrderStatusCounts()).extracting(StaffDashboardSummaryResponse.OrderStatusCount::getStatus)
                .containsExactly(
                        "PENDING_CONFIRMATION",
                        "CONFIRMED",
                        "OUT_OF_STOCK_WAITING",
                        "SHIPPING",
                        "DELIVERED",
                        "COMPLETED",
                        "CANCELLED"
                );
    }

    @Test
    void getDashboardSummary_withStatusAndRange_shouldFilterTrendOnly() {
        User staff = User.builder().id(42L).email("staff@m4n.vn").build();
        when(userRepository.findByEmailIgnoreCase("staff@m4n.vn")).thenReturn(Optional.of(staff));
        when(orderRepository.countByStatusAndCreatedAtBetween(
                org.mockito.ArgumentMatchers.eq(OrderStatus.COMPLETED),
                any(Instant.class),
                any(Instant.class)
        )).thenReturn(1L);

        StaffDashboardSummaryResponse response = staffDashboardService.getDashboardSummary(
                "staff@m4n.vn",
                14,
                OrderStatus.COMPLETED
        );

        assertThat(response.getOrderTrend()).hasSize(14);
        assertThat(response.getOrderTrend()).allSatisfy(point -> assertThat(point.getOrderCount()).isEqualTo(1L));
        verify(orderRepository, times(14)).countByStatusAndCreatedAtBetween(
                org.mockito.ArgumentMatchers.eq(OrderStatus.COMPLETED),
                any(Instant.class),
                any(Instant.class)
        );
    }

    @Test
    void getDashboardSummary_withUnsupportedRange_shouldRejectRequest() {
        assertThatThrownBy(() -> staffDashboardService.getDashboardSummary("staff@m4n.vn", 8, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Khoảng thời gian chỉ hỗ trợ 7, 14 hoặc 30 ngày.");
    }
}
