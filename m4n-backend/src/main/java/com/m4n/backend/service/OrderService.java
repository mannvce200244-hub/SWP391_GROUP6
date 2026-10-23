package com.m4n.backend.service;

import com.m4n.backend.dto.request.CheckoutPreviewRequest;
import com.m4n.backend.dto.request.PlaceOrderRequest;
import com.m4n.backend.dto.response.CheckoutPreviewResponse;
import com.m4n.backend.dto.response.OrderConfirmResultResponse;
import com.m4n.backend.dto.response.OrderDetailResponse;
import com.m4n.backend.dto.response.OrderResponse;
import com.m4n.backend.entity.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Map;

public interface OrderService {

    CheckoutPreviewResponse previewCheckout(CheckoutPreviewRequest request);

    OrderResponse placeOrder(PlaceOrderRequest request);

    List<OrderResponse> getMyOrders();

    OrderDetailResponse getMyOrderDetail(Long orderId);

    OrderDetailResponse customerCancelOrder(Long orderId, String reason);

    OrderDetailResponse customerConfirmReceived(Long orderId);

    Page<OrderResponse> getAdminOrders(OrderStatus status, Boolean isPaid, String paymentMethod, String search, Pageable pageable);

    Map<String, Long> getOrderStatusCounts();

    OrderDetailResponse getAdminOrderDetail(Long orderId);

    OrderConfirmResultResponse confirmOrder(Long orderId);

    OrderConfirmResultResponse retryOrderConfirmation(Long orderId);

    OrderDetailResponse markOrderShipping(Long orderId);

    OrderDetailResponse markOrderDelivered(Long orderId);

    OrderDetailResponse staffCancelOrder(Long orderId, String reason);

    Page<OrderResponse> getCustomerOrderHistory(Long customerId, Pageable pageable);
}
