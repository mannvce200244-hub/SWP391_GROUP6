package com.m4n.backend.service;

import com.m4n.backend.dto.request.AddToCartRequest;
import com.m4n.backend.dto.request.UpdateCartItemRequest;
import com.m4n.backend.dto.response.CartResponse;

public interface CartService {

    CartResponse getMyCart();

    CartResponse addToCart(AddToCartRequest request);

    CartResponse updateCartItem(Long itemId, UpdateCartItemRequest request);

    CartResponse removeCartItem(Long itemId);
}
