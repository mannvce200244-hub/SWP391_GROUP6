package com.m4n.backend.service;

import com.m4n.backend.dto.request.PlaceOrderRequest;
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
        assertThat(response.totalAmount()).isEqualByComparingTo(new BigDecimal("5000000.00")); // 2 * 2.5m
        assertThat(response.finalAmount()).isEqualByComparingTo(new BigDecimal("5000000.00"));

        // Verify cart is cleared
        verify(cartItemRepository).deleteAll(any());

        // CRITICAL: Verify inventory was NEVER modified during place order!
        verify(inventoryRepository, never()).findByProductIdWithLock(any());
        verify(inventoryRepository, never()).save(any());
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

        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
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

        when(orderRepository.findById(2L)).thenReturn(Optional.of(order));
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

        when(orderRepository.findById(3L)).thenReturn(Optional.of(order));
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

        when(orderRepository.findById(4L)).thenReturn(Optional.of(order));

        assertThatThrownBy(() -> orderService.customerCancelOrder(4L, "Muon huy"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Chờ xác nhận");
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

        when(orderRepository.findById(5L)).thenReturn(Optional.of(order));

        assertThatThrownBy(() -> orderService.customerCancelOrder(5L, "Hack"))
                .isInstanceOf(AccessDeniedException.class);

        assertThatThrownBy(() -> orderService.getMyOrderDetail(5L))
                .isInstanceOf(AccessDeniedException.class);
    }
}
