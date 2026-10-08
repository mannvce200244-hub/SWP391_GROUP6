package com.m4n.backend.mapper;

import com.m4n.backend.dto.response.OrderDetailResponse;
import com.m4n.backend.dto.response.OrderItemResponse;
import com.m4n.backend.dto.response.OrderResponse;
import com.m4n.backend.entity.Order;
import com.m4n.backend.entity.OrderItem;
import com.m4n.backend.entity.OrderStatus;
import com.m4n.backend.entity.Product;
import com.m4n.backend.entity.ProductMedia;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;

@Component
@RequiredArgsConstructor
public class OrderMapper {

    private final CartMapper cartMapper;

    public String formatStatusLabel(OrderStatus status) {
        if (status == null) {
            return "Không xác định";
        }
        return switch (status) {
            case PENDING_CONFIRMATION -> "Chờ xác nhận";
            case CONFIRMED -> "Đã xác nhận";
            case OUT_OF_STOCK_WAITING -> "Chờ xử lý tồn kho";
            case COMPLETED -> "Hoàn thành";
            case CANCELLED -> "Đã hủy";
        };
    }

    public OrderItemResponse toOrderItemResponse(OrderItem item) {
        if (item == null) {
            return null;
        }

        BigDecimal price = item.getPrice() != null ? item.getPrice() : BigDecimal.ZERO;
        int qty = item.getQuantity() != null ? item.getQuantity() : 0;
        BigDecimal lineTotal = price.multiply(BigDecimal.valueOf(qty));

        String imageUrl = null;
        Product product = item.getProduct();
        if (product != null && product.getMedia() != null && !product.getMedia().isEmpty()) {
            imageUrl = product.getMedia().stream()
                    .filter(m -> m.getMediaType() != null && m.getMediaType().name().equalsIgnoreCase("IMAGE"))
                    .findFirst()
                    .map(ProductMedia::getUrl)
                    .orElse(product.getMedia().get(0).getUrl());
        }

        return new OrderItemResponse(
                item.getId(),
                product != null ? product.getId() : null,
                item.getProductCode(),
                item.getProductName(),
                price,
                cartMapper.formatPriceDisplay(price),
                qty,
                lineTotal,
                cartMapper.formatPriceDisplay(lineTotal),
                imageUrl
        );
    }

    public OrderResponse toOrderResponse(Order order) {
        if (order == null) {
            return null;
        }

        int itemCount = order.getItems() != null
                ? order.getItems().stream().mapToInt(OrderItem::getQuantity).sum()
                : 0;

        return new OrderResponse(
                order.getId(),
                order.getOrderCode(),
                order.getStatus(),
                formatStatusLabel(order.getStatus()),
                order.getCustomerName(),
                order.getCustomerPhone(),
                order.getCustomerEmail(),
                order.getShippingAddress(),
                order.getTotalAmount(),
                cartMapper.formatPriceDisplay(order.getTotalAmount()),
                order.getDiscountAmount(),
                cartMapper.formatPriceDisplay(order.getDiscountAmount()),
                order.getFinalAmount(),
                cartMapper.formatPriceDisplay(order.getFinalAmount()),
                order.getPaymentMethod(),
                order.isPaid(),
                order.getVoucherCode(),
                itemCount,
                order.getCreatedAt()
        );
    }

    public OrderDetailResponse toOrderDetailResponse(Order order, boolean isCustomer) {
        if (order == null) {
            return null;
        }

        List<OrderItemResponse> itemResponses = order.getItems() != null
                ? order.getItems().stream().map(this::toOrderItemResponse).toList()
                : Collections.emptyList();

        boolean canCustomerCancel = isCustomer && order.getStatus() == OrderStatus.PENDING_CONFIRMATION;

        return new OrderDetailResponse(
                order.getId(),
                order.getOrderCode(),
                order.getStatus(),
                formatStatusLabel(order.getStatus()),
                order.getCustomerName(),
                order.getCustomerPhone(),
                order.getCustomerEmail(),
                order.getShippingAddress(),
                order.getNotes(),
                order.getTotalAmount(),
                cartMapper.formatPriceDisplay(order.getTotalAmount()),
                order.getDiscountAmount(),
                cartMapper.formatPriceDisplay(order.getDiscountAmount()),
                order.getFinalAmount(),
                cartMapper.formatPriceDisplay(order.getFinalAmount()),
                order.getPaymentMethod(),
                order.isPaid(),
                order.getVoucherCode(),
                itemResponses,
                canCustomerCancel,
                order.getCreatedAt(),
                order.getUpdatedAt()
        );
    }
}
