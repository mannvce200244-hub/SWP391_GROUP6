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
import java.util.Objects;

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
            case SHIPPING -> "Đang giao hàng";
            case DELIVERED -> "Đã giao hàng";
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

        Product product = item.getProduct();
        String imageUrl = getProductImageUrl(product);

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

        String itemsSummary = null;
        String imageUrl = null;
        if (order.getItems() != null && !order.getItems().isEmpty()) {
            StringBuilder sb = new StringBuilder();
            int limit = 2;
            int count = 0;
            for (OrderItem item : order.getItems()) {
                if (count > 0) {
                    sb.append(", ");
                }
                if (count >= limit) {
                    sb.append(String.format("và %d sản phẩm khác", order.getItems().size() - limit));
                    break;
                }
                sb.append(item.getProductName() != null ? item.getProductName() : "Nhạc cụ");
                if (item.getQuantity() != null && item.getQuantity() > 1) {
                    sb.append(" x").append(item.getQuantity());
                }
                count++;
            }
            itemsSummary = sb.toString();
            imageUrl = order.getItems().stream()
                    .map(OrderItem::getProduct)
                    .map(this::getProductImageUrl)
                    .filter(Objects::nonNull)
                    .findFirst()
                    .orElse(null);
        }

        return new OrderResponse(
                order.getId(),
                order.getOrderCode(),
                order.getStatus(),
                formatStatusLabel(order.getStatus()),
                order.getCustomerName(),
                order.getCustomerPhone(),
                order.getCustomerEmail(),
                order.getShippingAddress(),
                order.getNotes(),
                itemsSummary,
                imageUrl,
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

    private String getProductImageUrl(Product product) {
        if (product == null || product.getMedia() == null || product.getMedia().isEmpty()) {
            return null;
        }

        return product.getMedia().stream()
                .filter(media -> media.getMediaType() != null
                        && media.getMediaType().name().equalsIgnoreCase("IMAGE"))
                .findFirst()
                .map(ProductMedia::getUrl)
                .orElse(product.getMedia().get(0).getUrl());
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
