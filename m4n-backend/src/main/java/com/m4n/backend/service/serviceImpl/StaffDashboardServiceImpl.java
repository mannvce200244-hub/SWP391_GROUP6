package com.m4n.backend.service.serviceImpl;

import com.m4n.backend.dto.response.StaffDashboardSummaryResponse;
import com.m4n.backend.entity.ConversationStatus;
import com.m4n.backend.entity.OrderStatus;
import com.m4n.backend.entity.User;
import com.m4n.backend.exception.ResourceNotFoundException;
import com.m4n.backend.repository.ChatMessageRepository;
import com.m4n.backend.repository.ConversationRepository;
import com.m4n.backend.repository.OrderRepository;
import com.m4n.backend.repository.UserRepository;
import com.m4n.backend.service.StaffDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StaffDashboardServiceImpl implements StaffDashboardService {

    private static final ZoneId VN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final Set<Integer> ALLOWED_TREND_DAYS = Set.of(7, 14, 30);

    private final OrderRepository orderRepository;
    private final ConversationRepository conversationRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;

    @Override
    public StaffDashboardSummaryResponse getDashboardSummary(
            String staffEmail,
            int days,
            OrderStatus status
    ) {
        if (!ALLOWED_TREND_DAYS.contains(days)) {
            throw new IllegalArgumentException("Khoảng thời gian chỉ hỗ trợ 7, 14 hoặc 30 ngày.");
        }

        User staff = userRepository.findByEmailIgnoreCase(staffEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản nhân viên."));

        StaffDashboardSummaryResponse.KpiSummary kpi = StaffDashboardSummaryResponse.KpiSummary.builder()
                .pendingOrders(orderRepository.countByStatus(OrderStatus.PENDING_CONFIRMATION))
                .confirmedOrders(orderRepository.countByStatus(OrderStatus.CONFIRMED))
                .waitingConversations(conversationRepository.countByStatusAndAssignedStaffIsNull(ConversationStatus.OPEN))
                .unreadMessages(chatMessageRepository.countUnreadAssignedToStaff(ConversationStatus.OPEN, staff.getId()))
                .build();

        return StaffDashboardSummaryResponse.builder()
                .kpi(kpi)
                .orderTrend(buildOrderTrend(days, status))
                .orderStatusCounts(buildOrderStatusCounts())
                .build();
    }

    private List<StaffDashboardSummaryResponse.OrderTrendPoint> buildOrderTrend(
            int days,
            OrderStatus status
    ) {
        LocalDate today = LocalDate.now(VN_ZONE);
        List<StaffDashboardSummaryResponse.OrderTrendPoint> points = new ArrayList<>();

        for (int daysAgo = days - 1; daysAgo >= 0; daysAgo--) {
            LocalDate date = today.minusDays(daysAgo);
            Instant start = date.atStartOfDay(VN_ZONE).toInstant();
            Instant end = date.plusDays(1).atStartOfDay(VN_ZONE).toInstant();
            long orderCount = status == null
                    ? orderRepository.countByCreatedAtGreaterThanEqualAndCreatedAtLessThan(start, end)
                    : orderRepository.countByStatusAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(status, start, end);

            points.add(StaffDashboardSummaryResponse.OrderTrendPoint.builder()
                    .date(date)
                    .orderCount(orderCount)
                    .build());
        }

        return points;
    }

    private List<StaffDashboardSummaryResponse.OrderStatusCount> buildOrderStatusCounts() {
        return List.of(
                statusCount(OrderStatus.PENDING_CONFIRMATION, "Chờ xác nhận"),
                statusCount(OrderStatus.CONFIRMED, "Đã xác nhận"),
                statusCount(OrderStatus.OUT_OF_STOCK_WAITING, "Chờ bổ sung kho"),
                statusCount(OrderStatus.SHIPPING, "Đang giao hàng"),
                statusCount(OrderStatus.DELIVERED, "Đã giao hàng"),
                statusCount(OrderStatus.COMPLETED, "Đã hoàn thành"),
                statusCount(OrderStatus.CANCELLED, "Đã hủy")
        );
    }

    private StaffDashboardSummaryResponse.OrderStatusCount statusCount(OrderStatus status, String label) {
        return StaffDashboardSummaryResponse.OrderStatusCount.builder()
                .status(status.name())
                .label(label)
                .count(orderRepository.countByStatus(status))
                .build();
    }
}
