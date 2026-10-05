package com.m4n.backend.controller;

import com.m4n.backend.dto.request.AddToCartRequest;
import com.m4n.backend.dto.request.UpdateCartItemRequest;
import com.m4n.backend.dto.response.CartResponse;
import com.m4n.backend.service.CartService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/cart")
@Tag(name = "Cart", description = "Customer shopping cart management APIs")
@SecurityRequirement(name = "bearerAuth")
public class CartController {

    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    @GetMapping
    @Operation(summary = "Get current user's cart", description = "Returns active cart items and totals for authenticated customer.")
    public ResponseEntity<CartResponse> getMyCart() {
        return ResponseEntity.ok(cartService.getMyCart());
    }

    @PostMapping("/items")
    @Operation(summary = "Add product to cart", description = "Adds or increments product in cart. Does NOT reserve or deduct inventory.")
    public ResponseEntity<CartResponse> addToCart(@Valid @RequestBody AddToCartRequest request) {
        return ResponseEntity.ok(cartService.addToCart(request));
    }

    @PutMapping("/items/{id}")
    @Operation(summary = "Update cart item quantity", description = "Updates quantity of a specific cart item. If quantity is 0, removes the item.")
    public ResponseEntity<CartResponse> updateCartItem(
            @PathVariable Long id,
            @Valid @RequestBody UpdateCartItemRequest request
    ) {
        return ResponseEntity.ok(cartService.updateCartItem(id, request));
    }

    @DeleteMapping("/items/{id}")
    @Operation(summary = "Remove item from cart", description = "Deletes a specific item from the authenticated customer's cart.")
    public ResponseEntity<CartResponse> removeCartItem(@PathVariable Long id) {
        return ResponseEntity.ok(cartService.removeCartItem(id));
    }
}
