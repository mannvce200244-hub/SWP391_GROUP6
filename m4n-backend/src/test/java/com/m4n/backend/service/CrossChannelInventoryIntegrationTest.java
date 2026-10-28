package com.m4n.backend.service;

import com.m4n.backend.dto.request.PosSaleItemRequest;
import com.m4n.backend.dto.request.PosSaleRequest;
import com.m4n.backend.dto.request.StockImportRequest;
import com.m4n.backend.dto.request.ConfirmStockDocumentRequest;
import com.m4n.backend.dto.response.OrderConfirmResultResponse;
import com.m4n.backend.dto.response.PosSaleResponse;
import com.m4n.backend.dto.response.DiscountCalculationResponse;
import com.m4n.backend.entity.Category;
import com.m4n.backend.entity.Inventory;
import com.m4n.backend.entity.Invoice;
import com.m4n.backend.entity.Order;
import com.m4n.backend.entity.OrderItem;
import com.m4n.backend.entity.OrderStatus;
import com.m4n.backend.entity.Product;
import com.m4n.backend.entity.Role;
import com.m4n.backend.entity.RoleName;
import com.m4n.backend.entity.User;
import com.m4n.backend.entity.StockDocument;
import com.m4n.backend.mapper.CartMapper;
import com.m4n.backend.mapper.OrderMapper;
import com.m4n.backend.repository.CartRepository;
import com.m4n.backend.repository.InventoryRepository;
import com.m4n.backend.repository.InventoryMovementRepository;
import com.m4n.backend.repository.InvoiceRepository;
import com.m4n.backend.repository.OrderRepository;
import com.m4n.backend.repository.ProductMediaRepository;
import com.m4n.backend.repository.ProductRepository;
import com.m4n.backend.repository.UserRepository;
import com.m4n.backend.repository.StockDocumentRepository;
import com.m4n.backend.service.serviceImpl.InventoryServiceImpl;
import com.m4n.backend.service.serviceImpl.OrderServiceImpl;
import com.m4n.backend.service.serviceImpl.PosServiceImpl;
import com.m4n.backend.service.serviceImpl.StockDocumentServiceImpl;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
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
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CrossChannelInventoryIntegrationTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private InventoryRepository inventoryRepository;

    @Mock
    private InventoryMovementRepository inventoryMovementRepository;

    @Mock
    private ProductMediaRepository productMediaRepository;

    @Mock
    private InvoiceRepository invoiceRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private CartRepository cartRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private VoucherService voucherService;
    @Mock private StockDocumentRepository stockDocumentRepository;
    @Mock private NotificationService notificationService;
    @Mock private PaymentService paymentService;

    private InventoryService inventoryService;
    private PosService posService;
    private OrderService orderService;
    private StockDocumentService stockDocumentService;

    private Product productA;
    private Inventory sharedInventoryA;
    private User staffUser;

    @Mock private ProductPricingService productPricingService;
    @Mock private ShippingService shippingService;

    @BeforeEach
    void setUp() {
        org.mockito.Mockito.lenient().when(shippingService.calculateShipping(any(), any())).thenReturn(
                new ShippingQuote(BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, false));
        org.mockito.Mockito.lenient().when(productPricingService.resolvePrices(any())).thenAnswer(inv -> {
            java.util.List<Product> requested = inv.getArgument(0);
            return requested.stream().collect(java.util.stream.Collectors.toMap(Product::getId,
                    product -> new ProductPrice(product.getPrice(), product.getPrice(), BigDecimal.ZERO, null), (first, duplicate) -> first));
        });

        lenient().when(voucherService.consumeDiscounts(any(), any(), anyInt())).thenAnswer(invocation ->
                new DiscountCalculationResponse(null, null, BigDecimal.ZERO, BigDecimal.ZERO,
                        BigDecimal.ZERO, invocation.getArgument(1)));
        inventoryService = new InventoryServiceImpl(inventoryRepository,
                inventoryMovementRepository, productMediaRepository);
        stockDocumentService = new StockDocumentServiceImpl(stockDocumentRepository, productRepository, inventoryRepository, inventoryService);
        posService = new PosServiceImpl(productRepository, inventoryRepository, invoiceRepository, userRepository, voucherService, inventoryService, productPricingService,
                mock(com.m4n.backend.repository.PosMomoPaymentRepository.class), mock(tools.jackson.databind.ObjectMapper.class));
        CartMapper cartMapper = new CartMapper();
        OrderMapper orderMapper = new OrderMapper(cartMapper);
        orderService = new OrderServiceImpl(
                orderRepository,
                cartRepository,
                productRepository,
                inventoryRepository,
                userRepository,
                voucherService,
                cartMapper,
                orderMapper, notificationService, inventoryService, paymentService, productPricingService, shippingService,
                new com.m4n.backend.service.serviceImpl.PendingOrderCancellationServiceImpl(orderRepository, voucherService, notificationService),
                org.mockito.Mockito.mock(org.springframework.transaction.PlatformTransactionManager.class)
        );

        Category cat = Category.builder().id(1L).name("Nhạc cụ dây").build();
        productA = Product.builder()
                .id(1L)
                .code("TRN-001")
                .name("Đàn Tranh 16 Dây")
                .price(new BigDecimal("8500000"))
                .category(cat)
                .media(new ArrayList<>())
                .isActive(true)
                .build();

        sharedInventoryA = Inventory.builder()
                .id(10L)
                .product(productA)
                .quantity(1) // Single available instrument
                .updatedAt(Instant.now())
                .build();

        Role staffRole = Role.builder().id(3L).name(RoleName.POS_STAFF).build();
        staffUser = User.builder()
                .id(99L)
                .email("pos@m4n.vn")
                .fullName("Nhân Viên Showroom")
                .role(staffRole)
                .build();

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("pos@m4n.vn", "password", List.of())
        );
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("Scenario 130: Concurrent Online Confirmation vs POS Sale - first wins, second rejected, never negative stock")
    void testCrossChannelConcurrencyFirstWinsSecondRejected() {
        // Shared Inventory has exactly 1 item
        assertThat(sharedInventoryA.getQuantity()).isEqualTo(1);

        when(userRepository.findByEmailIgnoreCase("pos@m4n.vn")).thenReturn(Optional.of(staffUser));
        when(productRepository.findByIdAndIsActiveTrue(1L)).thenReturn(Optional.of(productA));
        when(inventoryRepository.findByProductIdWithLock(1L)).thenReturn(Optional.of(sharedInventoryA));
        when(invoiceRepository.save(any(Invoice.class))).thenAnswer(inv -> {
            Invoice i = inv.getArgument(0);
            i.setId(100L);
            return i;
        });

        // 1. POS attempts sale of 1 item first and succeeds
        PosSaleRequest posRequest = PosSaleRequest.builder()
                .items(List.of(new PosSaleItemRequest(1L, 1)))
                .paymentMethod("BANK_TRANSFER")
                .build();

        PosSaleResponse posResponse = posService.finalizeSale(posRequest);
        assertThat(posResponse).isNotNull();
        // Inventory is now 0 (deducted immediately by POS)
        assertThat(sharedInventoryA.getQuantity()).isEqualTo(0);

        // 2. Concurrently or immediately after, Staff attempts to confirm a pending Online Order for 1 item
        Order pendingOrder = Order.builder()
                .id(50L)
                .orderCode("M4N-2026-ONLINE-01")
                .status(OrderStatus.PENDING_CONFIRMATION)
                .items(new ArrayList<>())
                .build();

        OrderItem orderItem = OrderItem.builder()
                .id(501L)
                .order(pendingOrder)
                .product(productA)
                .productName(productA.getName())
                .productCode(productA.getCode())
                .price(productA.getPrice())
                .quantity(1)
                .build();
        pendingOrder.getItems().add(orderItem);

        when(orderRepository.findByIdWithLock(50L)).thenReturn(Optional.of(pendingOrder));

        // Online confirmation re-checks inventory with lock:
        OrderConfirmResultResponse confirmResult = orderService.confirmOrder(50L);

        // Confirm MUST fail gracefully and transition order to OUT_OF_STOCK_WAITING
        assertThat(confirmResult.stockDeducted()).isFalse();
        assertThat(confirmResult.newStatus()).isEqualTo(OrderStatus.OUT_OF_STOCK_WAITING);
        assertThat(pendingOrder.getStatus()).isEqualTo(OrderStatus.OUT_OF_STOCK_WAITING);

        // Crucial Invariant: Inventory remains 0, NEVER -1!
        assertThat(sharedInventoryA.getQuantity()).isEqualTo(0);
    }

    @Test
    @DisplayName("Scenario 131: Stock Import -> POS Sale -> Online Order Place -> Online Confirmation")
    void testStockImportAndMultiChannelCycle() {
        // 1. Initial Stock = 2
        sharedInventoryA.setQuantity(2);

        when(productRepository.findByIdWithLock(1L)).thenReturn(Optional.of(productA));
        when(inventoryRepository.findByProductIdWithLock(1L)).thenReturn(Optional.of(sharedInventoryA));
        when(inventoryRepository.save(any(Inventory.class))).thenAnswer(inv -> inv.getArgument(0));

        when(productRepository.findById(1L)).thenReturn(Optional.of(productA));
        when(stockDocumentRepository.save(any())).thenAnswer(inv -> {
            StockDocument document = inv.getArgument(0);
            document.setId(5L);
            return document;
        });
        var draft = stockDocumentService.createReceipt(1L, new StockImportRequest(5, "Nhập thêm hàng"));
        assertThat(sharedInventoryA.getQuantity()).isEqualTo(2);
        org.mockito.ArgumentCaptor<StockDocument> captor = org.mockito.ArgumentCaptor.forClass(StockDocument.class);
        verify(stockDocumentRepository).save(captor.capture());
        when(stockDocumentRepository.findByIdWithLock(draft.id())).thenReturn(Optional.of(captor.getValue()));
        stockDocumentService.confirm(draft.id(), new ConfirmStockDocumentRequest(0, null));
        assertThat(sharedInventoryA.getQuantity()).isEqualTo(7); // 2 + 5 = 7

        // 2. Successful POS Sale of 3 items
        when(userRepository.findByEmailIgnoreCase("pos@m4n.vn")).thenReturn(Optional.of(staffUser));
        when(productRepository.findByIdAndIsActiveTrue(1L)).thenReturn(Optional.of(productA));
        when(invoiceRepository.save(any(Invoice.class))).thenAnswer(inv -> inv.getArgument(0));

        PosSaleRequest posRequest = PosSaleRequest.builder()
                .items(List.of(new PosSaleItemRequest(1L, 3)))
                .paymentMethod("BANK_TRANSFER")
                .build();

        posService.finalizeSale(posRequest);
        assertThat(sharedInventoryA.getQuantity()).isEqualTo(4); // 7 - 3 = 4

        // 3. Online Order placed for 2 items (Status: PENDING_CONFIRMATION)
        // Per BR-ORDER-01: Place order does NOT deduct stock
        Order onlineOrder = Order.builder()
                .id(77L)
                .orderCode("M4N-2026-77")
                .status(OrderStatus.PENDING_CONFIRMATION)
                .items(new ArrayList<>())
                .build();

        OrderItem item = OrderItem.builder()
                .id(771L)
                .order(onlineOrder)
                .product(productA)
                .productName(productA.getName())
                .productCode(productA.getCode())
                .price(productA.getPrice())
                .quantity(2)
                .build();
        onlineOrder.getItems().add(item);

        // Stock remains 4 after placing order
        assertThat(sharedInventoryA.getQuantity()).isEqualTo(4);

        // 4. Online Order confirmed by Staff
        when(orderRepository.findByIdWithLock(77L)).thenReturn(Optional.of(onlineOrder));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

        OrderConfirmResultResponse confirmResult = orderService.confirmOrder(77L);
        assertThat(confirmResult.stockDeducted()).isTrue();
        assertThat(onlineOrder.getStatus()).isEqualTo(OrderStatus.CONFIRMED);

        // Confirmed order atomically deducts 2 items
        assertThat(sharedInventoryA.getQuantity()).isEqualTo(2); // 4 - 2 = 2
    }
}
