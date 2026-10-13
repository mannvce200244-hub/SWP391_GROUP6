package com.m4n.backend.controller;

import com.m4n.backend.dto.request.CheckoutPreviewRequest;
import com.m4n.backend.dto.request.PlaceOrderRequest;
import com.m4n.backend.dto.response.CheckoutPreviewResponse;
import com.m4n.backend.dto.response.OrderConfirmResultResponse;
import com.m4n.backend.dto.response.OrderDetailResponse;
import com.m4n.backend.dto.response.OrderResponse;
import com.m4n.backend.entity.OrderStatus;
import com.m4n.backend.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
@Tag(name = "Orders & Checkout", description = "Order processing and checkout APIs")
@SecurityRequirement(name = "bearerAuth")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    // ==========================================
    // CUSTOMER COMMERCE ENDPOINTS
    // ==========================================

    @PostMapping("/checkout/preview")
    @Operation(summary = "Preview checkout totals", description = "Calculates authoritative subtotal, discount, and final amount based on current cart and voucher. Does NOT reserve stock.")
    public ResponseEntity<CheckoutPreviewResponse> previewCheckout(@RequestBody(required = false) CheckoutPreviewRequest request) {
        return ResponseEntity.ok(orderService.previewCheckout(request));
    }

    @PostMapping("/orders")
    @Operation(summary = "Place customer order", description = "Creates a new online order in PENDING_CONFIRMATION status. Does NOT deduct or reserve stock.")
    public ResponseEntity<OrderResponse> placeOrder(@Valid @RequestBody PlaceOrderRequest request) {
        OrderResponse response = orderService.placeOrder(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/orders/me")
    @Operation(summary = "Get current customer orders", description = "Returns order history for the authenticated customer.")
    public ResponseEntity<List<OrderResponse>> getMyOrders() {
        return ResponseEntity.ok(orderService.getMyOrders());
    }

    @GetMapping("/orders/{id}")
    @Operation(summary = "Get customer order detail", description = "Returns order detail with items and status timeline. Enforces ownership.")
    public ResponseEntity<OrderDetailResponse> getOrderDetail(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.getMyOrderDetail(id));
    }

    @PostMapping("/orders/{id}/cancel")
    @Operation(summary = "Customer self-cancel order", description = "Permitted ONLY when order status is PENDING_CONFIRMATION per BR-ORDER-02.")
    public ResponseEntity<OrderDetailResponse> customerCancelOrder(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body
    ) {
        String reason = body != null ? body.get("reason") : null;
        return ResponseEntity.ok(orderService.customerCancelOrder(id, reason));
    }

    // ==========================================
    // STAFF & ADMIN BACK-OFFICE ENDPOINTS
    // ==========================================

    @GetMapping("/admin/orders")
    @PreAuthorize("hasAnyRole('ONLINE_STAFF', 'ADMIN')")
    @Operation(summary = "List all orders for back-office", description = "Returns paginated orders with optional status and search filters.")
    public ResponseEntity<Page<OrderResponse>> getAdminOrders(
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(orderService.getAdminOrders(status, search, pageable));
    }

    @GetMapping("/admin/orders/{id}")
    @PreAuthorize("hasAnyRole('ONLINE_STAFF', 'ADMIN')")
    @Operation(summary = "Get order detail for back-office", description = "Returns comprehensive order details for staff processing.")
    public ResponseEntity<OrderDetailResponse> getAdminOrderDetail(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.getAdminOrderDetail(id));
    }

    @PostMapping("/admin/orders/{id}/confirm")
    @PreAuthorize("hasAnyRole('ONLINE_STAFF', 'ADMIN')")
    @Operation(summary = "Confirm pending order", description = "Re-checks inventory using pessimistic locks. If all items sufficient, deducts inventory and sets CONFIRMED. If insufficient, deducts nothing and sets OUT_OF_STOCK_WAITING.")
    public ResponseEntity<OrderConfirmResultResponse> confirmOrder(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.confirmOrder(id));
    }

    @PostMapping("/admin/orders/{id}/complete")
    @PreAuthorize("hasAnyRole('ONLINE_STAFF', 'ADMIN')")
    @Operation(summary = "Complete order", description = "Marks a confirmed order as COMPLETED.")
    public ResponseEntity<OrderDetailResponse> completeOrder(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.completeOrder(id));
    }

    @PostMapping("/admin/orders/{id}/cancel")
    @PreAuthorize("hasAnyRole('ONLINE_STAFF', 'ADMIN')")
    @Operation(summary = "Staff cancel order", description = "Cancels order and atomically restores inventory if it was previously confirmed.")
    public ResponseEntity<OrderDetailResponse> staffCancelOrder(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body
    ) {
        String reason = body != null ? body.get("reason") : null;
        return ResponseEntity.ok(orderService.staffCancelOrder(id, reason));
    }
}
