package com.m4n.backend.service.serviceImpl;

import com.m4n.backend.entity.NotificationType;
import com.m4n.backend.entity.Order;
import com.m4n.backend.entity.OrderStatus;
import com.m4n.backend.repository.OrderRepository;
import com.m4n.backend.service.NotificationService;
import com.m4n.backend.service.PendingOrderCancellationService;
import com.m4n.backend.service.VoucherService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PendingOrderCancellationServiceImpl implements PendingOrderCancellationService {
    private final OrderRepository orders;
    private final VoucherService vouchers;
    private final NotificationService notifications;

    @Override
    @Transactional(propagation = Propagation.MANDATORY)
    public Order complete(Order order, String reason) {
        if (order.getStatus() == OrderStatus.CANCELLED) return order;
        if (order.getStatus() != OrderStatus.PENDING_CONFIRMATION) {
            throw new IllegalStateException("Chỉ có thể tự hủy đơn hàng đang chờ xác nhận.");
        }
        order.setStatus(OrderStatus.CANCELLED);
        vouchers.releaseUsage(order.getVoucherCode());
        vouchers.releaseUsage(order.getAutomaticPromotionCode());
        vouchers.releaseUsage(order.getShippingVoucherCode());
        String note = "[Khách hàng tự hủy]";
        if (reason != null && !reason.isBlank()) note += " Lý do: " + reason.trim();
        order.setNotes(order.getNotes() == null ? note : order.getNotes() + " | " + note);
        Order saved = orders.save(order);
        notifications.createNotification(saved.getUser(), "Hủy đơn hàng thành công",
                "Quý khách đã hủy thành công đơn hàng " + saved.getOrderCode() + ".",
                NotificationType.ORDER, "/account/orders");
        return saved;
    }
}
