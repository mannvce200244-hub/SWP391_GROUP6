package com.m4n.backend.mapper;

import com.m4n.backend.dto.response.CartItemResponse;
import com.m4n.backend.dto.response.CartResponse;
import com.m4n.backend.entity.Cart;
import com.m4n.backend.entity.CartItem;
import com.m4n.backend.entity.Product;
import com.m4n.backend.entity.ProductMedia;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.util.Collections;
import java.util.List;
import java.util.Locale;

@Component
public class CartMapper {

    private final Locale vietnameseLocale = Locale.of("vi", "VN");

    public String formatPriceDisplay(BigDecimal price) {
        if (price == null) {
            return "0 ₫";
        }
        NumberFormat formatter = NumberFormat.getInstance(vietnameseLocale);
        return formatter.format(price) + " ₫";
    }

    public CartItemResponse toCartItemResponse(CartItem item) {
        if (item == null) {
            return null;
        }

        Product product = item.getProduct();
        BigDecimal unitPrice = product != null ? product.getPrice() : BigDecimal.ZERO;
        BigDecimal subtotal = unitPrice.multiply(BigDecimal.valueOf(item.getQuantity()));

        String imageUrl = null;
        if (product != null && product.getMedia() != null && !product.getMedia().isEmpty()) {
            imageUrl = product.getMedia().stream()
                    .filter(m -> m.getMediaType() != null && m.getMediaType().name().equalsIgnoreCase("IMAGE"))
                    .findFirst()
                    .map(ProductMedia::getUrl)
                    .orElse(product.getMedia().get(0).getUrl());
        }

        return new CartItemResponse(
                item.getId(),
                product != null ? product.getId() : null,
                product != null ? product.getCode() : null,
                product != null ? product.getName() : null,
                unitPrice,
                formatPriceDisplay(unitPrice),
                item.getQuantity(),
                subtotal,
                formatPriceDisplay(subtotal),
                imageUrl
        );
    }

    public CartResponse toCartResponse(Cart cart) {
        if (cart == null) {
            return new CartResponse(null, 0, Collections.emptyList(), BigDecimal.ZERO, formatPriceDisplay(BigDecimal.ZERO));
        }

        List<CartItemResponse> itemResponses = cart.getItems() != null
                ? cart.getItems().stream().map(this::toCartItemResponse).toList()
                : Collections.emptyList();

        int totalItems = cart.getItems() != null
                ? cart.getItems().stream().mapToInt(CartItem::getQuantity).sum()
                : 0;

        BigDecimal totalAmount = itemResponses.stream()
                .map(CartItemResponse::subtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new CartResponse(
                cart.getId(),
                totalItems,
                itemResponses,
                totalAmount,
                formatPriceDisplay(totalAmount)
        );
    }
}
