package com.m4n.backend.service;

import com.m4n.backend.dto.request.PlaceOrderRequest;
import com.m4n.backend.dto.response.OrderConfirmResultResponse;
import com.m4n.backend.dto.response.OrderDetailResponse;
import com.m4n.backend.dto.response.OrderResponse;
import com.m4n.backend.dto.response.VoucherValidationResponse;
import com.m4n.backend.entity.Cart;
import com.m4n.backend.entity.CartItem;
import com.m4n.backend.entity.Inventory;
import com.m4n.backend.entity.MediaType;
import com.m4n.backend.entity.Order;
import com.m4n.backend.entity.OrderItem;
import com.m4n.backend.entity.OrderStatus;
import com.m4n.backend.entity.Product;
import com.m4n.backend.entity.ProductMedia;
import com.m4n.backend.entity.Role;
import com.m4n.backend.entity.RoleName;
import com.m4n.backend.entity.User;
import com.m4n.backend.mapper.CartMapper;
import com.m4n.backend.mapper.OrderMapper;
import com.m4n.backend.repository.CartItemRepository;
import com.m4n.backend.repository.CartRepository;
import com.m4n.backend.repository.InventoryRepository;
import com.m4n.backend.repository.OrderRepository;
import com.m4n.backend.repository.ProductRepository;
import com.m4n.backend.repository.UserRepository;
import com.m4n.backend.serviceImpl.OrderServiceImpl;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private CartRepository cartRepository;

    @Mock
    private CartItemRepository cartItemRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private InventoryRepository inventoryRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private VoucherService voucherService;

    private OrderService orderService;

    private User testUser;
    private Product testProduct;

    @BeforeEach
    void setUp() {
        CartMapper cartMapper = new CartMapper();
        OrderMapper orderMapper = new OrderMapper(cartMapper);
        orderService = new OrderServiceImpl(
                orderRepository, cartRepository, cartItemRepository, productRepository,
                inventoryRepository, userRepository, voucherService, cartMapper, orderMapper
        );

        Role customerRole = Role.builder().id(1L).name(RoleName.CUSTOMER).build();
        testUser = User.builder()
                .id(100L)
                .email("test.customer@m4n.vn")
                .fullName("Nguyen Van Khach")
                .role(customerRole)
                .isActive(true)
                .build();

        testProduct = Product.builder()
                .id(10L)
                .code("DAN-TRANH-01")
                .name("Đàn Tranh 19 Dây")
                .price(new BigDecimal("2500000.00"))
                .isActive(true)
                .build();
        testProduct.getMedia().add(ProductMedia.builder()
                .mediaType(MediaType.IMAGE)
                .url("/assets/images/prod-dan-tranh.jpg")
                .sortOrder(1)
                .product(testProduct)
                .build());

        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(testUser.getEmail(), null, List.of());
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("BR-ORDER-01: Place order must start in PENDING_CONFIRMATION and must NOT deduct inventory")
    void placeOrder_shouldStartInPendingConfirmationAndNotDeductInventory() {
        when(userRepository.findByEmailIgnoreCase(testUser.getEmail())).thenReturn(Optional.of(testUser));

        Cart cart = Cart.builder().id(1L).user(testUser).items(new ArrayList<>()).build();
        CartItem cartItem = CartItem.builder().id(5L).cart(cart).product(testProduct).quantity(2).build();
        cart.getItems().add(cartItem);

        when(cartRepository.findWithItemsByUserId(testUser.getId())).thenReturn(Optional.of(cart));
        when(productRepository.findByIdAndIsActiveTrue(testProduct.getId())).thenReturn(Optional.of(testProduct));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> {
            Order o = invocation.getArgument(0);
            o.setId(99L);
            return o;
        });

        PlaceOrderRequest request = new PlaceOrderRequest(
                "Nguyen Van Khach",
                "0912345678",
                "test.customer@m4n.vn",
                "123 Nguyen Trai, Ha Noi",
                "COD",
                null,
                "Giao gio hanh chinh"
        );

        OrderResponse response = orderService.placeOrder(request);

        assertThat(response).isNotNull();
        assertThat(response.status()).isEqualTo(OrderStatus.PENDING_CONFIRMATION);
        assertThat(response.isPaid()).isFalse();
        assertThat(response.totalAmount()).isEqualByComparingTo(new BigDecimal("5000000.00")); // 2 * 2.5m
        assertThat(response.finalAmount()).isEqualByComparingTo(new BigDecimal("5000000.00"));
        assertThat(response.imageUrl()).isEqualTo("/assets/images/prod-dan-tranh.jpg");

        // Verify cart is cleared
        verify(cartItemRepository).deleteAll(any());

        // CRITICAL: Verify inventory was NEVER modified during place order!
        verify(inventoryRepository, never()).findByProductIdWithLock(any());
        verify(inventoryRepository, never()).save(any());
    }

    @Test
    @DisplayName("Payment authority: unsupported or unverified online payment cannot create a paid order")
    void placeOrder_withUnverifiedOnlinePayment_shouldBeRejectedBeforeMutation() {
        when(userRepository.findByEmailIgnoreCase(testUser.getEmail())).thenReturn(Optional.of(testUser));
        PlaceOrderRequest request = new PlaceOrderRequest(
                "Nguyen Van Khach",
                "0912345678",
                "test.customer@m4n.vn",
                "123 Nguyen Trai, Ha Noi",
                "ONLINE",
                null,
                null
        );

        assertThatThrownBy(() -> orderService.placeOrder(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("chưa được kích hoạt");

        verify(orderRepository, never()).save(any(Order.class));
        verify(inventoryRepository, never()).save(any(Inventory.class));
        verify(cartItemRepository, never()).deleteAll(any());
    }

    @Test
    @DisplayName("BR-INVENTORY-01: Confirmation re-checks inventory and atomically deducts stock when sufficient")
    void confirmOrder_withSufficientStock_shouldDeductStockAndSetConfirmed() {
        Order order = Order.builder()
                .id(1L)
                .orderCode("M4N-2026-001")
                .status(OrderStatus.PENDING_CONFIRMATION)
                .items(new ArrayList<>())
                .build();

        OrderItem item = OrderItem.builder()
                .id(11L)
                .order(order)
                .product(testProduct)
                .productName(testProduct.getName())
                .quantity(2)
                .price(testProduct.getPrice())
                .build();
        order.getItems().add(item);

        Inventory inventory = Inventory.builder()
                .id(50L)
                .product(testProduct)
                .quantity(10) // 10 available, 2 requested
                .updatedAt(Instant.now())
                .build();

        when(orderRepository.findByIdWithLock(1L)).thenReturn(Optional.of(order));
        when(inventoryRepository.findByProductIdWithLock(testProduct.getId())).thenReturn(Optional.of(inventory));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        OrderConfirmResultResponse result = orderService.confirmOrder(1L);

        assertThat(result.newStatus()).isEqualTo(OrderStatus.CONFIRMED);
        assertThat(result.stockDeducted()).isTrue();
        // 10 - 2 = 8 remaining in stock
        assertThat(inventory.getQuantity()).isEqualTo(8);
        verify(inventoryRepository).save(inventory);
    }

    @Test
    @DisplayName("BR-INVENTORY-01: Confirmation with insufficient stock must NOT deduct stock and move to OUT_OF_STOCK_WAITING")
    void confirmOrder_withInsufficientStock_shouldNotDeductStockAndSetOutOfStockWaiting() {
        Order order = Order.builder()
                .id(2L)
                .orderCode("M4N-2026-002")
                .status(OrderStatus.PENDING_CONFIRMATION)
                .items(new ArrayList<>())
                .build();

        OrderItem item = OrderItem.builder()
                .id(12L)
                .order(order)
                .product(testProduct)
                .productName(testProduct.getName())
                .quantity(5)
                .price(testProduct.getPrice())
                .build();
        order.getItems().add(item);

        Inventory inventory = Inventory.builder()
                .id(50L)
                .product(testProduct)
                .quantity(2) // only 2 available, requested 5
                .updatedAt(Instant.now())
                .build();

        when(orderRepository.findByIdWithLock(2L)).thenReturn(Optional.of(order));
        when(inventoryRepository.findByProductIdWithLock(testProduct.getId())).thenReturn(Optional.of(inventory));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        OrderConfirmResultResponse result = orderService.confirmOrder(2L);

        assertThat(result.newStatus()).isEqualTo(OrderStatus.OUT_OF_STOCK_WAITING);
        assertThat(result.stockDeducted()).isFalse();
        // Stock remains untouched at 2!
        assertThat(inventory.getQuantity()).isEqualTo(2);
        verify(inventoryRepository, never()).save(inventory);
    }

    @Test
    @DisplayName("Retry waiting order with sufficient stock confirms and deducts exactly once")
    void retryOrderConfirmation_withSufficientStock_shouldConfirm() {
        Order order = orderWithSingleItem(20L, OrderStatus.OUT_OF_STOCK_WAITING, 2);
        Inventory inventory = inventoryForTestProduct(5);
        when(orderRepository.findByIdWithLock(20L)).thenReturn(Optional.of(order));
        when(inventoryRepository.findByProductIdWithLock(testProduct.getId())).thenReturn(Optional.of(inventory));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        OrderConfirmResultResponse result = orderService.retryOrderConfirmation(20L);

        assertThat(result.previousStatus()).isEqualTo(OrderStatus.OUT_OF_STOCK_WAITING);
        assertThat(result.newStatus()).isEqualTo(OrderStatus.CONFIRMED);
        assertThat(result.stockDeducted()).isTrue();
        assertThat(inventory.getQuantity()).isEqualTo(3);
    }

    @Test
    @DisplayName("Retry waiting order with one insufficient item keeps waiting and deducts nothing")
    void retryOrderConfirmation_withOneInsufficientItem_shouldNotPartiallyDeduct() {
        Product productB = Product.builder()
                .id(11L)
                .code("DAN-BAU-01")
                .name("Đàn Bầu")
                .price(new BigDecimal("1800000"))
                .isActive(true)
                .build();
        Order order = orderWithSingleItem(21L, OrderStatus.OUT_OF_STOCK_WAITING, 2);
        order.getItems().add(OrderItem.builder()
                .id(212L)
                .order(order)
                .product(productB)
                .productName(productB.getName())
                .quantity(3)
                .price(productB.getPrice())
                .build());
        Inventory inventoryA = inventoryForTestProduct(5);
        Inventory inventoryB = Inventory.builder().id(51L).product(productB).quantity(1).build();
        when(orderRepository.findByIdWithLock(21L)).thenReturn(Optional.of(order));
        when(inventoryRepository.findByProductIdWithLock(testProduct.getId())).thenReturn(Optional.of(inventoryA));
        when(inventoryRepository.findByProductIdWithLock(productB.getId())).thenReturn(Optional.of(inventoryB));

        OrderConfirmResultResponse result = orderService.retryOrderConfirmation(21L);

        assertThat(result.newStatus()).isEqualTo(OrderStatus.OUT_OF_STOCK_WAITING);
        assertThat(result.stockDeducted()).isFalse();
        assertThat(inventoryA.getQuantity()).isEqualTo(5);
        assertThat(inventoryB.getQuantity()).isEqualTo(1);
        verify(inventoryRepository, never()).save(any(Inventory.class));
    }

    @Test
    @DisplayName("Retry rejects orders that are no longer waiting")
    void retryOrderConfirmation_whenNotWaiting_shouldReject() {
        Order confirmed = orderWithSingleItem(22L, OrderStatus.CONFIRMED, 1);
        when(orderRepository.findByIdWithLock(22L)).thenReturn(Optional.of(confirmed));

        assertThatThrownBy(() -> orderService.retryOrderConfirmation(22L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Chờ xử lý tồn kho");
        verify(inventoryRepository, never()).save(any(Inventory.class));
    }

    @Test
    @DisplayName("Retry rejects cancelled orders without touching inventory")
    void retryOrderConfirmation_whenCancelled_shouldReject() {
        Order cancelled = orderWithSingleItem(23L, OrderStatus.CANCELLED, 1);
        when(orderRepository.findByIdWithLock(23L)).thenReturn(Optional.of(cancelled));

        assertThatThrownBy(() -> orderService.retryOrderConfirmation(23L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Chờ xử lý tồn kho");
        verify(inventoryRepository, never()).findByProductIdWithLock(any());
        verify(inventoryRepository, never()).save(any(Inventory.class));
    }

    @Test
    @DisplayName("COD stays unpaid until the owning customer confirms a delivered order")
    void customerConfirmReceived_whenDeliveredCod_shouldCompleteAndMarkPaid() {
        Order order = orderWithSingleItem(24L, OrderStatus.DELIVERED, 1);
        order.setUser(testUser);
        order.setPaymentMethod("COD");
        order.setPaid(false);
        when(userRepository.findByEmailIgnoreCase(testUser.getEmail())).thenReturn(Optional.of(testUser));
        when(orderRepository.findByIdWithLock(24L)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        OrderDetailResponse response = orderService.customerConfirmReceived(24L);

        assertThat(response.status()).isEqualTo(OrderStatus.COMPLETED);
        assertThat(response.isPaid()).isTrue();
        assertThat(order.isPaid()).isTrue();
    }

    @Test
    @DisplayName("Staff moves a confirmed order through shipping and delivered in order")
    void deliveryLifecycle_shouldRequireOrderedTransitions() {
        Order order = orderWithSingleItem(25L, OrderStatus.CONFIRMED, 1);
        when(orderRepository.findByIdWithLock(25L)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        assertThat(orderService.markOrderShipping(25L).status()).isEqualTo(OrderStatus.SHIPPING);
        assertThat(orderService.markOrderDelivered(25L).status()).isEqualTo(OrderStatus.DELIVERED);
    }

    @Test
    @DisplayName("Customer cannot confirm receipt before the order is delivered")
    void customerConfirmReceived_whenShipping_shouldReject() {
        Order order = orderWithSingleItem(26L, OrderStatus.SHIPPING, 1);
        order.setUser(testUser);
        when(userRepository.findByEmailIgnoreCase(testUser.getEmail())).thenReturn(Optional.of(testUser));
        when(orderRepository.findByIdWithLock(26L)).thenReturn(Optional.of(order));

        assertThatThrownBy(() -> orderService.customerConfirmReceived(26L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Đã giao hàng");
        verify(orderRepository, never()).save(any(Order.class));
    }

    @Test
    @DisplayName("BR-ORDER-02: Customer may self-cancel ONLY when Order.status is PENDING_CONFIRMATION")
    void customerCancelOrder_whenPendingConfirmation_shouldAllowCancel() {
        when(userRepository.findByEmailIgnoreCase(testUser.getEmail())).thenReturn(Optional.of(testUser));

        Order order = Order.builder()
                .id(3L)
                .user(testUser)
                .orderCode("M4N-2026-003")
                .status(OrderStatus.PENDING_CONFIRMATION)
                .items(new ArrayList<>())
                .build();

        when(orderRepository.findByIdWithLock(3L)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        OrderDetailResponse response = orderService.customerCancelOrder(3L, "Doi y khong mua nua");

        assertThat(response.status()).isEqualTo(OrderStatus.CANCELLED);
    }

    @Test
    @DisplayName("BR-ORDER-02: Customer self-cancel must be REJECTED when Order is CONFIRMED")
    void customerCancelOrder_whenConfirmed_shouldBeRejected() {
        when(userRepository.findByEmailIgnoreCase(testUser.getEmail())).thenReturn(Optional.of(testUser));

        Order order = Order.builder()
                .id(4L)
                .user(testUser)
                .orderCode("M4N-2026-004")
                .status(OrderStatus.CONFIRMED)
                .items(new ArrayList<>())
                .build();

        when(orderRepository.findByIdWithLock(4L)).thenReturn(Optional.of(order));

        assertThatThrownBy(() -> orderService.customerCancelOrder(4L, "Muon huy"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Chờ xác nhận");
    }

    @Test
    @DisplayName("Staff cancellation of waiting order does not restore stock")
    void staffCancelOrder_whenWaiting_shouldNotRestoreStock() {
        Order order = orderWithSingleItem(30L, OrderStatus.OUT_OF_STOCK_WAITING, 2);
        when(orderRepository.findByIdWithLock(30L)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        OrderDetailResponse response = orderService.staffCancelOrder(30L, "Khách không muốn chờ");

        assertThat(response.status()).isEqualTo(OrderStatus.CANCELLED);
        verify(inventoryRepository, never()).findByProductIdWithLock(any());
        verify(inventoryRepository, never()).save(any(Inventory.class));
    }

    @Test
    @DisplayName("Staff cancellation of confirmed order restores stock exactly once")
    void staffCancelOrder_whenConfirmed_shouldRestoreExactlyOnce() {
        Order order = orderWithSingleItem(31L, OrderStatus.CONFIRMED, 2);
        Inventory inventory = inventoryForTestProduct(3);
        when(orderRepository.findByIdWithLock(31L)).thenReturn(Optional.of(order));
        when(inventoryRepository.findByProductIdWithLock(testProduct.getId())).thenReturn(Optional.of(inventory));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        OrderDetailResponse response = orderService.staffCancelOrder(31L, "Hủy theo yêu cầu");

        assertThat(response.status()).isEqualTo(OrderStatus.CANCELLED);
        assertThat(inventory.getQuantity()).isEqualTo(5);

        assertThatThrownBy(() -> orderService.staffCancelOrder(31L, "Hủy lần hai"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("đã bị hủy");
        assertThat(inventory.getQuantity()).isEqualTo(5);
        verify(inventoryRepository).save(inventory);
    }

    @Test
    @DisplayName("Staff cannot cancel or restock orders after shipping has started")
    void staffCancelOrder_whenShippingOrDelivered_shouldRejectWithoutRestocking() {
        Order shipping = orderWithSingleItem(33L, OrderStatus.SHIPPING, 1);
        Order delivered = orderWithSingleItem(34L, OrderStatus.DELIVERED, 1);
        when(orderRepository.findByIdWithLock(33L)).thenReturn(Optional.of(shipping));
        when(orderRepository.findByIdWithLock(34L)).thenReturn(Optional.of(delivered));

        assertThatThrownBy(() -> orderService.staffCancelOrder(33L, "Đơn đang giao"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("đã bắt đầu giao");
        assertThatThrownBy(() -> orderService.staffCancelOrder(34L, "Đơn đã giao"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("đã bắt đầu giao");

        verify(inventoryRepository, never()).findByProductIdWithLock(any());
        verify(inventoryRepository, never()).save(any(Inventory.class));
        verify(orderRepository, never()).save(any(Order.class));
    }

    @Test
    @DisplayName("Completed order cannot be cancelled and must use the return workflow")
    void staffCancelOrder_whenCompleted_shouldReject() {
        Order order = orderWithSingleItem(32L, OrderStatus.COMPLETED, 1);
        when(orderRepository.findByIdWithLock(32L)).thenReturn(Optional.of(order));

        assertThatThrownBy(() -> orderService.staffCancelOrder(32L, "Không hợp lệ"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("đã hoàn tất");
        verify(inventoryRepository, never()).save(any(Inventory.class));
    }

    @Test
    @DisplayName("Security: Customer cannot cancel or access another customer's order")
    void customerCannotAccessAnotherCustomerOrder() {
        when(userRepository.findByEmailIgnoreCase(testUser.getEmail())).thenReturn(Optional.of(testUser));

        User otherUser = User.builder().id(999L).email("other@m4n.vn").build();
        Order order = Order.builder()
                .id(5L)
                .user(otherUser)
                .orderCode("M4N-2026-005")
                .status(OrderStatus.PENDING_CONFIRMATION)
                .build();

        when(orderRepository.findByIdWithLock(5L)).thenReturn(Optional.of(order));
        when(orderRepository.findById(5L)).thenReturn(Optional.of(order));

        assertThatThrownBy(() -> orderService.customerCancelOrder(5L, "Hack"))
                .isInstanceOf(AccessDeniedException.class);

        assertThatThrownBy(() -> orderService.customerConfirmReceived(5L))
                .isInstanceOf(AccessDeniedException.class);

        assertThatThrownBy(() -> orderService.getMyOrderDetail(5L))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    @DisplayName("Admin/Staff: getOrderStatusCounts returns accurate count per status")
    void getOrderStatusCounts_shouldReturnCountsMap() {
        when(orderRepository.countByStatus(OrderStatus.PENDING_CONFIRMATION)).thenReturn(3L);
        when(orderRepository.countByStatus(OrderStatus.CONFIRMED)).thenReturn(5L);
        when(orderRepository.countByStatus(OrderStatus.OUT_OF_STOCK_WAITING)).thenReturn(1L);
        when(orderRepository.countByStatus(OrderStatus.SHIPPING)).thenReturn(4L);
        when(orderRepository.countByStatus(OrderStatus.DELIVERED)).thenReturn(2L);
        when(orderRepository.countByStatus(OrderStatus.COMPLETED)).thenReturn(10L);
        when(orderRepository.countByStatus(OrderStatus.CANCELLED)).thenReturn(2L);

        java.util.Map<String, Long> counts = orderService.getOrderStatusCounts();

        assertThat(counts).isNotNull();
        assertThat(counts.get("ALL")).isEqualTo(27L);
        assertThat(counts.get("PENDING_CONFIRMATION")).isEqualTo(3L);
        assertThat(counts.get("CONFIRMED")).isEqualTo(5L);
        assertThat(counts.get("OUT_OF_STOCK_WAITING")).isEqualTo(1L);
        assertThat(counts.get("SHIPPING")).isEqualTo(4L);
        assertThat(counts.get("DELIVERED")).isEqualTo(2L);
        assertThat(counts.get("COMPLETED")).isEqualTo(10L);
        assertThat(counts.get("CANCELLED")).isEqualTo(2L);
    }

    private Order orderWithSingleItem(Long orderId, OrderStatus status, int quantity) {
        Order order = Order.builder()
                .id(orderId)
                .orderCode("M4N-2026-" + orderId)
                .status(status)
                .items(new ArrayList<>())
                .build();
        order.getItems().add(OrderItem.builder()
                .id(orderId * 10)
                .order(order)
                .product(testProduct)
                .productName(testProduct.getName())
                .quantity(quantity)
                .price(testProduct.getPrice())
                .build());
        return order;
    }

    private Inventory inventoryForTestProduct(int quantity) {
        return Inventory.builder()
                .id(50L)
                .product(testProduct)
                .quantity(quantity)
                .updatedAt(Instant.now())
                .build();
    }
}
