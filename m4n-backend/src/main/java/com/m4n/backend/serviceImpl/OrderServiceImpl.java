package com.m4n.backend.serviceImpl;

import com.m4n.backend.dto.request.CheckoutPreviewRequest;
import com.m4n.backend.dto.request.PlaceOrderRequest;
import com.m4n.backend.dto.response.CartItemResponse;
import com.m4n.backend.dto.response.CheckoutPreviewResponse;
import com.m4n.backend.dto.response.OrderConfirmResultResponse;
import com.m4n.backend.dto.response.OrderDetailResponse;
import com.m4n.backend.dto.response.OrderResponse;
import com.m4n.backend.dto.response.VoucherValidationResponse;
import com.m4n.backend.entity.Cart;
import com.m4n.backend.entity.CartItem;
import com.m4n.backend.entity.Inventory;
import com.m4n.backend.entity.Order;
import com.m4n.backend.entity.OrderItem;
import com.m4n.backend.entity.OrderStatus;
import com.m4n.backend.entity.Product;
import com.m4n.backend.entity.User;
import com.m4n.backend.exception.ResourceNotFoundException;
import com.m4n.backend.mapper.CartMapper;
import com.m4n.backend.mapper.OrderMapper;
import com.m4n.backend.repository.CartItemRepository;
import com.m4n.backend.repository.CartRepository;
import com.m4n.backend.repository.InventoryRepository;
import com.m4n.backend.repository.OrderRepository;
import com.m4n.backend.repository.ProductRepository;
import com.m4n.backend.repository.UserRepository;
import com.m4n.backend.service.OrderService;
import com.m4n.backend.service.VoucherService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Year;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final InventoryRepository inventoryRepository;
    private final UserRepository userRepository;
    private final VoucherService voucherService;
    private final CartMapper cartMapper;
    private final OrderMapper orderMapper;

    private static final Random RANDOM = new Random();

    @Override
    @Transactional(readOnly = true)
    public CheckoutPreviewResponse previewCheckout(CheckoutPreviewRequest request) {
        User user = getAuthenticatedUser();
        Cart cart = cartRepository.findWithItemsByUserId(user.getId()).orElse(null);

        if (cart == null || cart.getItems() == null || cart.getItems().isEmpty()) {
            return new CheckoutPreviewResponse(
                    Collections.emptyList(), 0,
                    BigDecimal.ZERO, cartMapper.formatPriceDisplay(BigDecimal.ZERO),
                    null,
                    BigDecimal.ZERO, cartMapper.formatPriceDisplay(BigDecimal.ZERO),
                    BigDecimal.ZERO, cartMapper.formatPriceDisplay(BigDecimal.ZERO),
                    false, "Giỏ hàng của bạn đang trống"
            );
        }

        List<CartItemResponse> previewItems = new ArrayList<>();
        BigDecimal subtotal = BigDecimal.ZERO;
        int totalItems = 0;

        for (CartItem item : cart.getItems()) {
            // Load fresh product from DB for authoritative price and sellability
            Product product = productRepository.findByIdAndIsActiveTrue(item.getProduct().getId())
                    .orElse(null);

            if (product != null) {
                BigDecimal unitPrice = product.getPrice();
                int qty = item.getQuantity();
                BigDecimal lineTotal = unitPrice.multiply(BigDecimal.valueOf(qty));
                subtotal = subtotal.add(lineTotal);
                totalItems += qty;

                previewItems.add(cartMapper.toCartItemResponse(item));
            }
        }

        String voucherCode = request != null ? request.voucherCode() : null;
        BigDecimal discount = BigDecimal.ZERO;
        BigDecimal finalAmount = subtotal;
        boolean voucherApplied = false;
        String voucherMessage = null;

        if (voucherCode != null && !voucherCode.trim().isEmpty()) {
            VoucherValidationResponse voucherResult = voucherService.validateAndCalculate(voucherCode, subtotal);
            if (voucherResult.isValid()) {
                discount = voucherResult.discountAmount();
                finalAmount = voucherResult.finalAmount();
                voucherApplied = true;
                voucherMessage = voucherResult.message();
            } else {
                voucherMessage = voucherResult.message();
            }
        }

        return new CheckoutPreviewResponse(
                previewItems,
                totalItems,
                subtotal,
                cartMapper.formatPriceDisplay(subtotal),
                voucherCode,
                discount,
                cartMapper.formatPriceDisplay(discount),
                finalAmount,
                cartMapper.formatPriceDisplay(finalAmount),
                voucherApplied,
                voucherMessage
        );
    }

    @Override
    @Transactional
    public OrderResponse placeOrder(PlaceOrderRequest request) {
        User user = getAuthenticatedUser();
        Cart cart = cartRepository.findWithItemsByUserId(user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Giỏ hàng của bạn đang trống. Không thể đặt hàng."));

        if (cart.getItems() == null || cart.getItems().isEmpty()) {
            throw new IllegalArgumentException("Giỏ hàng của bạn đang trống. Vui lòng chọn sản phẩm trước khi thanh toán.");
        }

        BigDecimal subtotal = BigDecimal.ZERO;
        List<OrderItem> orderItems = new ArrayList<>();

        // Validate and build snapshots using authoritative database product data
        for (CartItem cartItem : cart.getItems()) {
            Product product = productRepository.findByIdAndIsActiveTrue(cartItem.getProduct().getId())
                    .orElseThrow(() -> new IllegalArgumentException("Sản phẩm '" + cartItem.getProduct().getName() + "' hiện không còn kinh doanh."));

            BigDecimal unitPrice = product.getPrice();
            int qty = cartItem.getQuantity();
            if (qty <= 0) {
                throw new IllegalArgumentException("Số lượng sản phẩm trong giỏ hàng không hợp lệ.");
            }

            BigDecimal lineTotal = unitPrice.multiply(BigDecimal.valueOf(qty));
            subtotal = subtotal.add(lineTotal);

            OrderItem orderItem = OrderItem.builder()
                    .product(product)
                    .productName(product.getName())
                    .productCode(product.getCode())
                    .price(unitPrice)
                    .quantity(qty)
                    .build();

            orderItems.add(orderItem);
        }

        // Revalidate voucher at Place Order
        BigDecimal discount = BigDecimal.ZERO;
        String appliedVoucherCode = null;

        if (request.voucherCode() != null && !request.voucherCode().trim().isEmpty()) {
            VoucherValidationResponse voucherResult = voucherService.validateAndCalculate(request.voucherCode(), subtotal);
            if (!voucherResult.isValid()) {
                throw new IllegalArgumentException("Mã voucher không hợp lệ: " + voucherResult.message());
            }
            discount = voucherResult.discountAmount();
            appliedVoucherCode = voucherResult.code();
        }

        BigDecimal finalAmount = subtotal.subtract(discount);
        if (finalAmount.compareTo(BigDecimal.ZERO) < 0) {
            finalAmount = BigDecimal.ZERO;
        }

        // Generate unique order code: M4N-YYYY-XXXXXX
        String orderCode = generateOrderCode();

        Order order = Order.builder()
                .orderCode(orderCode)
                .user(user)
                .customerName(request.customerName().trim())
                .customerPhone(request.customerPhone().trim())
                .customerEmail(request.customerEmail().trim())
                .shippingAddress(request.shippingAddress().trim())
                .totalAmount(subtotal)
                .discountAmount(discount)
                .finalAmount(finalAmount)
                .status(OrderStatus.PENDING_CONFIRMATION)
                .paymentMethod(request.paymentMethod().trim())
                .isPaid(false)
                .voucherCode(appliedVoucherCode)
                .notes(request.notes() != null ? request.notes().trim() : null)
                .items(new ArrayList<>())
                .build();

        for (OrderItem it : orderItems) {
            it.setOrder(order);
            order.getItems().add(it);
        }

        // Save order and items
        Order savedOrder = orderRepository.save(order);

        // Clear cart items atomically after order creation
        cartItemRepository.deleteAll(cart.getItems());
        cart.getItems().clear();
        cartRepository.save(cart);

        // CRITICAL INVARIANT: DO NOT DEDUCT INVENTORY AT PLACE ORDER TIME.
        log.info("Successfully placed online order: {} with status PENDING_CONFIRMATION. Inventory was NOT deducted.", orderCode);

        return orderMapper.toOrderResponse(savedOrder);
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderResponse> getMyOrders() {
        User user = getAuthenticatedUser();
        List<Order> orders = orderRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        return orders.stream().map(orderMapper::toOrderResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public OrderDetailResponse getMyOrderDetail(Long orderId) {
        User user = getAuthenticatedUser();
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Đơn hàng không tồn tại: " + orderId));

        if (order.getUser() == null || !order.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("Bạn không có quyền truy cập đơn hàng này");
        }

        return orderMapper.toOrderDetailResponse(order, true);
    }

    @Override
    @Transactional
    public OrderDetailResponse customerCancelOrder(Long orderId, String reason) {
        User user = getAuthenticatedUser();
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Đơn hàng không tồn tại: " + orderId));

        if (order.getUser() == null || !order.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("Bạn không có quyền thao tác trên đơn hàng này");
        }

        // BR-ORDER-02: Customer may self-cancel only when Order.status = PENDING_CONFIRMATION
        if (order.getStatus() != OrderStatus.PENDING_CONFIRMATION) {
            throw new IllegalArgumentException(
                    "Quý khách chỉ có thể tự hủy đơn hàng khi đơn đang ở trạng thái 'Chờ xác nhận'. " +
                    "Đối với đơn đã xác nhận hoặc đang xử lý, vui lòng liên hệ trực tiếp với M4N."
            );
        }

        order.setStatus(OrderStatus.CANCELLED);
        String cancelNote = "[Khách hàng tự hủy]";
        if (reason != null && !reason.trim().isEmpty()) {
            cancelNote += " Lý do: " + reason.trim();
        }
        order.setNotes(order.getNotes() != null ? order.getNotes() + " | " + cancelNote : cancelNote);

        // Inventory was never deducted during PENDING_CONFIRMATION, so no restoration needed
        Order savedOrder = orderRepository.save(order);
        log.info("Customer cancelled pending order: {}", order.getOrderCode());

        return orderMapper.toOrderDetailResponse(savedOrder, true);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<OrderResponse> getAdminOrders(OrderStatus status, String search, Pageable pageable) {
        return orderRepository.searchOrders(status, search, pageable)
                .map(orderMapper::toOrderResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderDetailResponse getAdminOrderDetail(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Đơn hàng không tồn tại: " + orderId));
        return orderMapper.toOrderDetailResponse(order, false);
    }

    @Override
    @Transactional
    public OrderConfirmResultResponse confirmOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Đơn hàng không tồn tại: " + orderId));

        if (order.getStatus() != OrderStatus.PENDING_CONFIRMATION) {
            throw new IllegalArgumentException("Chỉ có thể xác nhận đơn hàng đang ở trạng thái 'Chờ xác nhận'. Trạng thái hiện tại: " + orderMapper.formatStatusLabel(order.getStatus()));
        }

        // BR-INVENTORY-01 & BR-INVENTORY-02: Re-check inventory for ALL items using Pessimistic Lock
        Map<Long, Inventory> lockedInventories = new HashMap<>();
        boolean allSufficient = true;
        String insufficientReason = null;

        for (OrderItem item : order.getItems()) {
            Long productId = item.getProduct().getId();
            Inventory inventory = inventoryRepository.findByProductIdWithLock(productId)
                    .orElse(null);

            if (inventory == null || inventory.getQuantity() < item.getQuantity()) {
                allSufficient = false;
                int available = inventory != null ? inventory.getQuantity() : 0;
                insufficientReason = String.format("Nhạc cụ '%s' không đủ số lượng trong kho (Yêu cầu: %d, Hiện có: %d).",
                        item.getProductName(), item.getQuantity(), available);
                break;
            }

            lockedInventories.put(productId, inventory);
        }

        // Concurrency / Oversale protection:
        if (!allSufficient) {
            // Deduct NOTHING. Move to approved OUT_OF_STOCK_WAITING
            order.setStatus(OrderStatus.OUT_OF_STOCK_WAITING);
            String stockNote = "[Hết hàng tại thời điểm xác nhận] " + insufficientReason;
            order.setNotes(order.getNotes() != null ? order.getNotes() + " | " + stockNote : stockNote);
            orderRepository.save(order);

            log.warn("Order {} could not be confirmed due to insufficient stock. Transitioned to OUT_OF_STOCK_WAITING. Reason: {}",
                    order.getOrderCode(), insufficientReason);

            return new OrderConfirmResultResponse(
                    order.getId(),
                    order.getOrderCode(),
                    OrderStatus.PENDING_CONFIRMATION,
                    OrderStatus.OUT_OF_STOCK_WAITING,
                    insufficientReason + " Đơn hàng đã chuyển sang trạng thái 'Chờ xử lý tồn kho'.",
                    false
            );
        }

        // If ALL items are sufficient: atomically deduct inventory
        for (OrderItem item : order.getItems()) {
            Inventory inventory = lockedInventories.get(item.getProduct().getId());
            inventory.setQuantity(inventory.getQuantity() - item.getQuantity());
            inventoryRepository.save(inventory);
        }

        order.setStatus(OrderStatus.CONFIRMED);
        Order savedOrder = orderRepository.save(order);

        log.info("Order {} confirmed by staff. Inventory successfully deducted atomically.", savedOrder.getOrderCode());

        return new OrderConfirmResultResponse(
                savedOrder.getId(),
                savedOrder.getOrderCode(),
                OrderStatus.PENDING_CONFIRMATION,
                OrderStatus.CONFIRMED,
                "Xác nhận đơn hàng thành công và đã trừ tồn kho an toàn.",
                true
        );
    }

    @Override
    @Transactional
    public OrderDetailResponse completeOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Đơn hàng không tồn tại: " + orderId));

        if (order.getStatus() != OrderStatus.CONFIRMED) {
            throw new IllegalArgumentException("Chỉ có thể hoàn thành đơn hàng đã được 'Đã xác nhận'. Trạng thái hiện tại: " + orderMapper.formatStatusLabel(order.getStatus()));
        }

        order.setStatus(OrderStatus.COMPLETED);
        if (order.getPaymentMethod() != null && order.getPaymentMethod().toUpperCase().contains("COD")) {
            order.setPaid(true);
        }
        Order savedOrder = orderRepository.save(order);
        log.info("Order {} completed successfully.", savedOrder.getOrderCode());

        return orderMapper.toOrderDetailResponse(savedOrder, false);
    }

    @Override
    @Transactional
    public OrderDetailResponse staffCancelOrder(Long orderId, String reason) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Đơn hàng không tồn tại: " + orderId));

        if (order.getStatus() == OrderStatus.COMPLETED || order.getStatus() == OrderStatus.CANCELLED) {
            throw new IllegalArgumentException("Không thể hủy đơn hàng đã hoàn tất hoặc đã bị hủy.");
        }

        // If order was already CONFIRMED, we must atomically restore deducted stock!
        if (order.getStatus() == OrderStatus.CONFIRMED) {
            for (OrderItem item : order.getItems()) {
                Inventory inventory = inventoryRepository.findByProductIdWithLock(item.getProduct().getId())
                        .orElse(null);
                if (inventory != null) {
                    inventory.setQuantity(inventory.getQuantity() + item.getQuantity());
                    inventoryRepository.save(inventory);
                }
            }
            log.info("Restored inventory for cancelled confirmed order: {}", order.getOrderCode());
        }

        order.setStatus(OrderStatus.CANCELLED);
        String cancelNote = "[Nhân viên hủy đơn]";
        if (reason != null && !reason.trim().isEmpty()) {
            cancelNote += " Lý do: " + reason.trim();
        }
        order.setNotes(order.getNotes() != null ? order.getNotes() + " | " + cancelNote : cancelNote);

        Order savedOrder = orderRepository.save(order);
        return orderMapper.toOrderDetailResponse(savedOrder, false);
    }

    private String generateOrderCode() {
        int year = Year.now().getValue();
        int randomNum = 100000 + RANDOM.nextInt(900000);
        return "M4N-" + year + "-" + randomNum;
    }

    private User getAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getName())) {
            throw new AccessDeniedException("Vui lòng đăng nhập để thực hiện thao tác này");
        }

        String email = authentication.getName();
        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin tài khoản người dùng"));
    }
}
