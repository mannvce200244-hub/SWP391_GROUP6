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
import com.m4n.backend.entity.RoleName;
import com.m4n.backend.entity.User;
import com.m4n.backend.exception.ResourceNotFoundException;
import com.m4n.backend.exception.InsufficientStockException;
import com.m4n.backend.mapper.CartMapper;
import com.m4n.backend.mapper.OrderMapper;
import com.m4n.backend.repository.CartItemRepository;
import com.m4n.backend.repository.CartRepository;
import com.m4n.backend.repository.InventoryRepository;
import com.m4n.backend.repository.OrderRepository;
import com.m4n.backend.repository.ProductRepository;
import com.m4n.backend.repository.UserRepository;
import com.m4n.backend.entity.NotificationType;
import com.m4n.backend.service.NotificationService;
import com.m4n.backend.service.OrderService;
import com.m4n.backend.service.VoucherService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
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
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Locale;
import java.util.Random;
import java.util.TreeMap;

@Slf4j
@Service
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
    private final NotificationService notificationService;

    private static final Random RANDOM = new Random();

    @Autowired
    public OrderServiceImpl(
            OrderRepository orderRepository,
            CartRepository cartRepository,
            CartItemRepository cartItemRepository,
            ProductRepository productRepository,
            InventoryRepository inventoryRepository,
            UserRepository userRepository,
            VoucherService voucherService,
            CartMapper cartMapper,
            OrderMapper orderMapper,
            NotificationService notificationService
    ) {
        this.orderRepository = orderRepository;
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.productRepository = productRepository;
        this.inventoryRepository = inventoryRepository;
        this.userRepository = userRepository;
        this.voucherService = voucherService;
        this.cartMapper = cartMapper;
        this.orderMapper = orderMapper;
        this.notificationService = notificationService;
    }

    public OrderServiceImpl(
            OrderRepository orderRepository,
            CartRepository cartRepository,
            CartItemRepository cartItemRepository,
            ProductRepository productRepository,
            InventoryRepository inventoryRepository,
            UserRepository userRepository,
            VoucherService voucherService,
            CartMapper cartMapper,
            OrderMapper orderMapper
    ) {
        this(orderRepository, cartRepository, cartItemRepository, productRepository,
             inventoryRepository, userRepository, voucherService, cartMapper, orderMapper, null);
    }

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
        String paymentMethod = request.paymentMethod().trim().toUpperCase(Locale.ROOT);
        if (!"COD".equals(paymentMethod)) {
            throw new IllegalArgumentException(
                    "Thanh toán trực tuyến chưa được kích hoạt. Vui lòng chọn thanh toán khi nhận hàng (COD)."
            );
        }
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

            inventoryRepository.findByProductId(product.getId()).ifPresent(inventory -> {
                int availableQuantity = inventory.getQuantity() == null ? 0 : inventory.getQuantity();
                if (qty > availableQuantity) {
                    throw new InsufficientStockException(
                            "Sản phẩm '" + product.getName() + "' chỉ còn " + availableQuantity
                                    + " sản phẩm. Vui lòng điều chỉnh số lượng trước khi đặt hàng."
                    );
                }
            });

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
            VoucherValidationResponse voucherResult = voucherService.validateAndConsume(request.voucherCode(), subtotal);
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
                .paymentMethod(paymentMethod)
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

        // Dispatch customer notification
        notifyUser(user, "Đơn hàng đã được tiếp nhận",
                "Đơn hàng " + orderCode + " đang chờ xác nhận từ nhân viên.",
                NotificationType.ORDER, "/account/orders");

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
        // Lock the order row so the status check is serialized against concurrent confirm/cancel
        Order order = orderRepository.findByIdWithLock(orderId)
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
        voucherService.releaseUsage(order.getVoucherCode());
        String cancelNote = "[Khách hàng tự hủy]";
        if (reason != null && !reason.trim().isEmpty()) {
            cancelNote += " Lý do: " + reason.trim();
        }
        order.setNotes(order.getNotes() != null ? order.getNotes() + " | " + cancelNote : cancelNote);

        // Inventory was never deducted during PENDING_CONFIRMATION, so no restoration needed
        Order savedOrder = orderRepository.save(order);
        log.info("Customer cancelled pending order: {}", order.getOrderCode());

        notifyUser(user, "Hủy đơn hàng thành công",
                "Quý khách đã hủy thành công đơn hàng " + order.getOrderCode() + ".",
                NotificationType.ORDER, "/account/orders");

        return orderMapper.toOrderDetailResponse(savedOrder, true);
    }

    @Override
    @Transactional
    public OrderDetailResponse customerConfirmReceived(Long orderId) {
        User user = getAuthenticatedUser();
        Order order = orderRepository.findByIdWithLock(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Đơn hàng không tồn tại: " + orderId));

        if (order.getUser() == null || !order.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("Bạn không có quyền thao tác trên đơn hàng này");
        }
        if (order.getStatus() != OrderStatus.DELIVERED) {
            throw new IllegalArgumentException(
                    "Chỉ có thể xác nhận nhận hàng khi đơn ở trạng thái 'Đã giao hàng'. Trạng thái hiện tại: "
                            + orderMapper.formatStatusLabel(order.getStatus())
            );
        }

        Order savedOrder = completeDeliveredOrder(order);
        log.info("Customer confirmed receipt for order {}.", savedOrder.getOrderCode());
        return orderMapper.toOrderDetailResponse(savedOrder, true);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<OrderResponse> getAdminOrders(OrderStatus status, Boolean isPaid, String paymentMethod, String search, Pageable pageable) {
        return orderRepository.searchOrders(status, isPaid, paymentMethod, search, pageable)
                .map(orderMapper::toOrderResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Long> getOrderStatusCounts() {
        Map<String, Long> counts = new LinkedHashMap<>();
        long pending = orderRepository.countByStatus(OrderStatus.PENDING_CONFIRMATION);
        long confirmed = orderRepository.countByStatus(OrderStatus.CONFIRMED);
        long outOfStock = orderRepository.countByStatus(OrderStatus.OUT_OF_STOCK_WAITING);
        long shipping = orderRepository.countByStatus(OrderStatus.SHIPPING);
        long delivered = orderRepository.countByStatus(OrderStatus.DELIVERED);
        long completed = orderRepository.countByStatus(OrderStatus.COMPLETED);
        long cancelled = orderRepository.countByStatus(OrderStatus.CANCELLED);
        long total = pending + confirmed + outOfStock + shipping + delivered + completed + cancelled;

        counts.put("ALL", total);
        counts.put("PENDING_CONFIRMATION", pending);
        counts.put("CONFIRMED", confirmed);
        counts.put("OUT_OF_STOCK_WAITING", outOfStock);
        counts.put("SHIPPING", shipping);
        counts.put("DELIVERED", delivered);
        counts.put("COMPLETED", completed);
        counts.put("CANCELLED", cancelled);
        return counts;
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
        return confirmOrderFromStatus(orderId, OrderStatus.PENDING_CONFIRMATION);
    }

    @Override
    @Transactional
    public OrderConfirmResultResponse retryOrderConfirmation(Long orderId) {
        return confirmOrderFromStatus(orderId, OrderStatus.OUT_OF_STOCK_WAITING);
    }

    private OrderConfirmResultResponse confirmOrderFromStatus(Long orderId, OrderStatus expectedStatus) {
        // Lock the order row first so concurrent confirmations serialize on the status
        // check-then-act below and cannot double-deduct inventory for the same order
        // (BR-INVENTORY-01, BR-INVENTORY-02, BR-INVENTORY-03).
        Order order = orderRepository.findByIdWithLock(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Đơn hàng không tồn tại: " + orderId));

        if (order.getStatus() != expectedStatus) {
            String requiredLabel = expectedStatus == OrderStatus.PENDING_CONFIRMATION
                    ? "Chờ xác nhận"
                    : "Chờ xử lý tồn kho";
            throw new IllegalArgumentException("Chỉ có thể thực hiện thao tác khi đơn hàng ở trạng thái '" + requiredLabel + "'. Trạng thái hiện tại: " + orderMapper.formatStatusLabel(order.getStatus()));
        }

        OrderStatus previousStatus = order.getStatus();

        // BR-INVENTORY-01 & BR-INVENTORY-02: Re-check inventory for ALL items using Pessimistic Lock.
        // Items are locked in ascending productId order to keep a deterministic lock ordering
        // and avoid deadlocks between two confirmations sharing overlapping products.
        Map<Long, Integer> requiredQuantities = new TreeMap<>();
        Map<Long, String> productNames = new HashMap<>();
        for (OrderItem item : order.getItems()) {
            Long productId = item.getProduct().getId();
            requiredQuantities.merge(productId, item.getQuantity(), Integer::sum);
            productNames.putIfAbsent(productId, item.getProductName());
        }

        Map<Long, Inventory> lockedInventories = new HashMap<>();
        List<String> insufficientReasons = new ArrayList<>();

        for (Map.Entry<Long, Integer> requirement : requiredQuantities.entrySet()) {
            Long productId = requirement.getKey();
            Inventory inventory = inventoryRepository.findByProductIdWithLock(productId)
                    .orElse(null);

            if (inventory == null || inventory.getQuantity() < requirement.getValue()) {
                int available = inventory != null ? inventory.getQuantity() : 0;
                insufficientReasons.add(String.format("Nhạc cụ '%s' không đủ số lượng trong kho (Yêu cầu: %d, Hiện có: %d).",
                        productNames.get(productId), requirement.getValue(), available));
            } else {
                lockedInventories.put(productId, inventory);
            }
        }

        // Concurrency / Oversale protection:
        if (!insufficientReasons.isEmpty()) {
            String insufficientReason = String.join(" ", insufficientReasons);
            if (previousStatus == OrderStatus.PENDING_CONFIRMATION) {
                // Deduct NOTHING. Move to approved OUT_OF_STOCK_WAITING.
                order.setStatus(OrderStatus.OUT_OF_STOCK_WAITING);
                String stockNote = "[Hết hàng tại thời điểm xác nhận] " + insufficientReason;
                order.setNotes(order.getNotes() != null ? order.getNotes() + " | " + stockNote : stockNote);
                orderRepository.save(order);

                notifyUser(order.getUser(), "Đơn hàng chờ xử lý kho",
                        "Đơn hàng " + order.getOrderCode() + " tạm thời chờ xử lý bổ sung tồn kho.",
                        NotificationType.ORDER, "/account/orders");
            }

            log.warn("Order {} could not be confirmed due to insufficient stock. Transitioned to OUT_OF_STOCK_WAITING. Reason: {}",
                    order.getOrderCode(), insufficientReason);

            return new OrderConfirmResultResponse(
                    order.getId(),
                    order.getOrderCode(),
                    previousStatus,
                    OrderStatus.OUT_OF_STOCK_WAITING,
                    insufficientReason + (previousStatus == OrderStatus.PENDING_CONFIRMATION
                            ? " Đơn hàng đã chuyển sang trạng thái 'Chờ xử lý tồn kho'."
                            : " Đơn hàng vẫn ở trạng thái 'Chờ xử lý tồn kho'."),
                    false
            );
        }

        // If ALL items are sufficient: atomically deduct inventory
        for (Map.Entry<Long, Integer> requirement : requiredQuantities.entrySet()) {
            Inventory inventory = lockedInventories.get(requirement.getKey());
            inventory.setQuantity(inventory.getQuantity() - requirement.getValue());
            inventoryRepository.save(inventory);
        }

        order.setStatus(OrderStatus.CONFIRMED);
        Order savedOrder = orderRepository.save(order);

        notifyUser(savedOrder.getUser(), "Đơn hàng đã được xác nhận",
                "Đơn hàng " + savedOrder.getOrderCode() + " đã được xác nhận và đang đóng gói.",
                NotificationType.ORDER, "/account/orders");

        log.info("Order {} confirmed by staff. Inventory successfully deducted atomically.", savedOrder.getOrderCode());

        return new OrderConfirmResultResponse(
                savedOrder.getId(),
                savedOrder.getOrderCode(),
                previousStatus,
                OrderStatus.CONFIRMED,
                "Xác nhận đơn hàng thành công và đã trừ tồn kho an toàn.",
                true
        );
    }

    @Override
    @Transactional
    public OrderDetailResponse markOrderShipping(Long orderId) {
        Order order = orderRepository.findByIdWithLock(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Đơn hàng không tồn tại: " + orderId));
        if (order.getStatus() != OrderStatus.CONFIRMED) {
            throw new IllegalArgumentException("Chỉ có thể bắt đầu giao đơn hàng đã xác nhận. Trạng thái hiện tại: " + orderMapper.formatStatusLabel(order.getStatus()));
        }

        order.setStatus(OrderStatus.SHIPPING);
        Order savedOrder = orderRepository.save(order);
        notifyUser(savedOrder.getUser(), "Đơn hàng đang được giao",
                "Đơn hàng " + savedOrder.getOrderCode() + " đã được bàn giao cho đơn vị vận chuyển.",
                NotificationType.ORDER, "/account/orders");
        log.info("Order {} moved to SHIPPING.", savedOrder.getOrderCode());
        return orderMapper.toOrderDetailResponse(savedOrder, false);
    }

    @Override
    @Transactional
    public OrderDetailResponse markOrderDelivered(Long orderId) {
        Order order = orderRepository.findByIdWithLock(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Đơn hàng không tồn tại: " + orderId));
        if (order.getStatus() != OrderStatus.SHIPPING) {
            throw new IllegalArgumentException("Chỉ có thể xác nhận đã giao cho đơn hàng đang giao. Trạng thái hiện tại: " + orderMapper.formatStatusLabel(order.getStatus()));
        }

        order.setStatus(OrderStatus.DELIVERED);
        Order savedOrder = orderRepository.save(order);
        notifyUser(savedOrder.getUser(), "Đơn hàng đã được giao",
                "Đơn hàng " + savedOrder.getOrderCode() + " đã được giao. Vui lòng xác nhận khi quý khách đã nhận đủ hàng.",
                NotificationType.ORDER, "/account/orders");
        log.info("Order {} moved to DELIVERED.", savedOrder.getOrderCode());
        return orderMapper.toOrderDetailResponse(savedOrder, false);
    }

    private Order completeDeliveredOrder(Order order) {
        order.setStatus(OrderStatus.COMPLETED);
        if ("COD".equalsIgnoreCase(order.getPaymentMethod())) {
            order.setPaid(true);
        }
        Order savedOrder = orderRepository.save(order);
        notifyUser(savedOrder.getUser(), "Đơn hàng hoàn thành",
                "Đơn hàng " + savedOrder.getOrderCode() + " đã hoàn thành. Quý khách có thể đánh giá sản phẩm ngay!",
                NotificationType.ORDER, "/account/orders");
        return savedOrder;
    }

    @Override
    @Transactional
    public OrderDetailResponse staffCancelOrder(Long orderId, String reason) {
        // Lock the order row so the status check is serialized against concurrent confirm/cancel:
        // a CONFIRMED deduction can never be overwritten by a cancellation that skipped restoration.
        Order order = orderRepository.findByIdWithLock(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Đơn hàng không tồn tại: " + orderId));

        if (order.getStatus() == OrderStatus.COMPLETED || order.getStatus() == OrderStatus.CANCELLED) {
            throw new IllegalArgumentException("Không thể hủy đơn hàng đã hoàn tất hoặc đã bị hủy.");
        }

        if (order.getStatus() == OrderStatus.SHIPPING || order.getStatus() == OrderStatus.DELIVERED) {
            throw new IllegalArgumentException(
                    "Không thể hủy đơn hàng đã bắt đầu giao. Cần hoàn tất quy trình giao nhận trước khi xử lý trả hàng."
            );
        }

        // CONFIRMED stock is still physically controlled by M4N and can be restored once.
        if (order.getStatus() == OrderStatus.CONFIRMED) {
            Map<Long, Integer> quantitiesToRestore = new TreeMap<>();
            for (OrderItem item : order.getItems()) {
                quantitiesToRestore.merge(item.getProduct().getId(), item.getQuantity(), Integer::sum);
            }

            Map<Long, Inventory> inventoriesToRestore = new HashMap<>();
            for (Long productId : quantitiesToRestore.keySet()) {
                Inventory inventory = inventoryRepository.findByProductIdWithLock(productId)
                        .orElseThrow(() -> new IllegalStateException(
                                "Không thể hoàn kho vì thiếu bản ghi tồn kho cho sản phẩm ID " + productId
                        ));
                inventoriesToRestore.put(productId, inventory);
            }

            for (Map.Entry<Long, Integer> restoration : quantitiesToRestore.entrySet()) {
                Inventory inventory = inventoriesToRestore.get(restoration.getKey());
                inventory.setQuantity(inventory.getQuantity() + restoration.getValue());
                inventoryRepository.save(inventory);
            }
            log.info("Restored inventory for cancelled confirmed order: {}", order.getOrderCode());
        }

        order.setStatus(OrderStatus.CANCELLED);
        voucherService.releaseUsage(order.getVoucherCode());
        String cancelNote = "[Nhân viên hủy đơn]";
        if (reason != null && !reason.trim().isEmpty()) {
            cancelNote += " Lý do: " + reason.trim();
        }
        order.setNotes(order.getNotes() != null ? order.getNotes() + " | " + cancelNote : cancelNote);

        Order savedOrder = orderRepository.save(order);

        notifyUser(savedOrder.getUser(), "Đơn hàng đã bị hủy",
                "Đơn hàng " + savedOrder.getOrderCode() + " đã bị hủy bởi ban quản trị.",
                NotificationType.ORDER, "/account/orders");

        return orderMapper.toOrderDetailResponse(savedOrder, false);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<OrderResponse> getCustomerOrderHistory(Long customerId, Pageable pageable) {
        User customer = userRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản khách hàng: " + customerId));
        if (customer.getRole() == null || customer.getRole().getName() != RoleName.CUSTOMER) {
            throw new IllegalArgumentException("Lịch sử đơn hàng chỉ áp dụng cho tài khoản khách hàng.");
        }
        return orderRepository.findByUserIdOrderByCreatedAtDesc(customerId, pageable)
                .map(orderMapper::toOrderResponse);
    }

    private void notifyUser(User user, String title, String message, NotificationType type, String link) {
        if (notificationService != null && user != null) {
            try {
                notificationService.createNotification(user, title, message, type, link);
            } catch (Exception e) {
                log.warn("Failed to dispatch notification: {}", e.getMessage());
            }
        }
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
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin tài khoản người dùng"));
        if (user.getRole().getName() != RoleName.CUSTOMER) {
            throw new AccessDeniedException("Luồng mua hàng trực tuyến chỉ dành cho tài khoản khách hàng.");
        }
        return user;
    }
}
