package com.m4n.backend.service;

import com.m4n.backend.dto.request.AddToCartRequest;
import com.m4n.backend.dto.request.PlaceOrderRequest;
import com.m4n.backend.entity.Inventory;
import com.m4n.backend.entity.Product;
import com.m4n.backend.entity.RoleName;
import com.m4n.backend.entity.User;
import com.m4n.backend.entity.OrderStatus;
import com.m4n.backend.entity.PromotionType;
import com.m4n.backend.entity.Voucher;
import com.m4n.backend.dto.response.DiscountCalculationResponse;
import com.m4n.backend.repository.CartRepository;
import com.m4n.backend.repository.CategoryRepository;
import com.m4n.backend.repository.InventoryRepository;
import com.m4n.backend.repository.NotificationRepository;
import com.m4n.backend.repository.OrderRepository;
import com.m4n.backend.repository.ProductRepository;
import com.m4n.backend.repository.RoleRepository;
import com.m4n.backend.repository.UserRepository;
import com.m4n.backend.repository.VoucherRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class CartCheckoutConcurrencyIntegrationTest {

    @Autowired private CartService cartService;
    @Autowired private OrderService orderService;
    @Autowired private UserRepository userRepository;
    @Autowired private RoleRepository roleRepository;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private ProductRepository productRepository;
    @Autowired private InventoryRepository inventoryRepository;
    @Autowired private CartRepository cartRepository;
    @Autowired private OrderRepository orderRepository;
    @Autowired private NotificationRepository notificationRepository;
    @Autowired private VoucherRepository voucherRepository;
    @Autowired private VoucherService voucherService;

    private User customer;
    private Product product;
    private Inventory inventory;

    @BeforeEach
    void setUp() {
        String suffix = UUID.randomUUID().toString().replace("-", "");
        customer = userRepository.save(User.builder().email("cart-race-" + suffix + "@example.test")
                .password("unused-integration-test-hash").fullName("Khách kiểm thử giỏ hàng")
                .role(roleRepository.findByName(RoleName.CUSTOMER).orElseThrow()).build());
        product = productRepository.save(Product.builder().code("CART-" + suffix)
                .name("Sản phẩm kiểm thử giỏ hàng").price(new BigDecimal("1000"))
                .category(categoryRepository.findAll().getFirst()).build());
        inventory = inventoryRepository.save(Inventory.builder().product(product).quantity(5).build());
        authenticate();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
        if (customer != null) {
            notificationRepository.deleteAll(notificationRepository.findTop20ByUserIdOrderByCreatedAtDesc(customer.getId()));
            orderRepository.deleteAll(orderRepository.findByUserId(customer.getId(), PageRequest.of(0, 100)));
            cartRepository.findByUserId(customer.getId()).ifPresent(cartRepository::delete);
        }
        if (product != null) jdbcTemplate.update("DELETE FROM inventory_movements WHERE product_id = ?", product.getId());
        if (inventory != null) inventoryRepository.deleteById(inventory.getId());
        if (product != null) productRepository.deleteById(product.getId());
        if (customer != null) userRepository.deleteById(customer.getId());
    }

    @Test
    void simultaneousFirstAddsCreateOneCartAndKeepBothQuantityIncrements() throws Exception {
        List<Throwable> failures = runConcurrent(() -> cartService.addToCart(new AddToCartRequest(product.getId(), 1)));

        assertThat(failures).isEmpty();
        var cart = cartService.getMyCart();
        assertThat(cart.items()).hasSize(1);
        assertThat(cart.items().getFirst().quantity()).isEqualTo(2);
        assertThat(cart.totalItems()).isEqualTo(2);
        assertThat(inventoryRepository.findByProductId(product.getId()).orElseThrow().getQuantity()).isEqualTo(5);
    }

    @Test
    void simultaneousCheckoutConsumesOneCartOnlyOnceAndDoesNotReserveStock() throws Exception {
        cartService.addToCart(new AddToCartRequest(product.getId(), 1));
        PlaceOrderRequest request = new PlaceOrderRequest(customer.getFullName(), "0900000000", customer.getEmail(),
                "Địa chỉ kiểm thử", "COD", null, "Ghi chú ban đầu");

        List<Throwable> failures = runConcurrent(() -> orderService.placeOrder(request));

        assertThat(failures).hasSize(1);
        assertThat(failures.getFirst()).isInstanceOf(IllegalArgumentException.class).hasMessageContaining("trống");
        assertThat(orderRepository.findByUserId(customer.getId(), PageRequest.of(0, 10)).getTotalElements())
                .isEqualTo(1);
        assertThat(cartService.getMyCart().items()).isEmpty();
        assertThat(inventoryRepository.findByProductId(product.getId()).orElseThrow().getQuantity()).isEqualTo(5);
    }

    @Test
    void orderListAppliesRequestedSortAndStatusBeforePaging() {
        cartService.addToCart(new AddToCartRequest(product.getId(), 2));
        PlaceOrderRequest request = new PlaceOrderRequest(customer.getFullName(), "0900000000", customer.getEmail(),
                "Địa chỉ kiểm thử", "COD", null, null);
        var expensive = orderService.placeOrder(request);
        cartService.addToCart(new AddToCartRequest(product.getId(), 1));
        var cheaper = orderService.placeOrder(request);
        PageRequest pageable = PageRequest.of(0, 1, Sort.by(Sort.Direction.ASC, "finalAmount", "id"));

        var firstPage = orderService.getMyOrders(OrderStatus.PENDING_CONFIRMATION, pageable);
        assertThat(firstPage.getTotalElements()).isEqualTo(2);
        assertThat(firstPage.getContent().getFirst().id()).isEqualTo(cheaper.id());
        orderService.customerCancelOrder(expensive.id(), "Kiểm thử bộ lọc trạng thái");
        assertThat(orderService.getMyOrders(OrderStatus.PENDING_CONFIRMATION, pageable).getTotalElements()).isEqualTo(1);
    }

    @Test
    void simultaneousAutomaticConsumptionDoesNotOveruseTheBestPromotionAndSelectsTheNextEligibleOne() throws Exception {
        List<Voucher> previouslyActive = voucherRepository.findAll().stream()
                .filter(voucher -> voucher.getPromotionType() == PromotionType.AUTOMATIC_ORDER && voucher.isActive()).toList();
        Voucher best = null;
        Voucher fallback = null;
        try {
            previouslyActive.forEach(voucher -> voucher.setActive(false));
            voucherRepository.saveAllAndFlush(previouslyActive);
            best = automaticPromotion("0.80");
            fallback = automaticPromotion("0.50");
            List<DiscountCalculationResponse> results = Collections.synchronizedList(new ArrayList<>());
            List<Throwable> failures = runConcurrent(() -> results.add(
                    voucherService.consumeDiscounts(null, new BigDecimal("1000"), 1)));
            assertThat(failures).isEmpty();
            assertThat(results).extracting(DiscountCalculationResponse::automaticDiscountAmount)
                    .containsExactlyInAnyOrder(new BigDecimal("800"), new BigDecimal("500"));
            assertThat(voucherRepository.findById(best.getId()).orElseThrow().getUsedCount()).isEqualTo(1);
            assertThat(voucherRepository.findById(fallback.getId()).orElseThrow().getUsedCount()).isEqualTo(1);
        } finally {
            if (best != null) voucherRepository.deleteById(best.getId());
            if (fallback != null) voucherRepository.deleteById(fallback.getId());
            previouslyActive.forEach(voucher -> voucher.setActive(true));
            voucherRepository.saveAllAndFlush(previouslyActive);
        }
    }

    private Voucher automaticPromotion(String rate) {
        return voucherRepository.saveAndFlush(Voucher.builder()
                .code("RACE-" + UUID.randomUUID().toString().replace("-", ""))
                .promotionType(PromotionType.AUTOMATIC_ORDER).discountRate(new BigDecimal(rate))
                .minimumOrderValue(BigDecimal.ZERO).usageLimit(1).build());
    }

    @Test
    void revenueUsesCompletionPeriodAndLongCancellationNotesRemainPersisted() {
        cartService.addToCart(new AddToCartRequest(product.getId(), 1));
        String customerNote = "N".repeat(500);
        var placed = orderService.placeOrder(new PlaceOrderRequest(customer.getFullName(), "0900000000",
                customer.getEmail(), "Địa chỉ kiểm thử", "COD", null, customerNote));
        var order = orderRepository.findById(placed.id()).orElseThrow();
        ZoneId zone = ZoneId.of("Asia/Ho_Chi_Minh");
        LocalDate monthStart = LocalDate.now(zone).withDayOfMonth(1);
        Instant periodStart = monthStart.atStartOfDay(zone).toInstant();
        Instant periodEnd = monthStart.plusMonths(1).atStartOfDay(zone).toInstant();
        BigDecimal revenueBefore = orderRepository.sumFinalAmountByStatusAndCompletedAtBetween(
                OrderStatus.COMPLETED, periodStart, periodEnd);

        orderService.confirmOrder(order.getId());
        orderService.markOrderShipping(order.getId());
        orderService.markOrderDelivered(order.getId());
        Instant oldPlacement = monthStart.minusMonths(1).plusDays(1).atStartOfDay(zone).toInstant();
        // createdAt is deliberately immutable; this test fixture predates the current reporting month.
        setOrderPlacementTime(order.getId(), oldPlacement);
        orderService.customerConfirmReceived(order.getId());

        var completed = orderRepository.findById(order.getId()).orElseThrow();
        assertThat(completed.getCompletedAt()).isNotNull();
        assertThat(orderRepository.sumFinalAmountByStatusAndCompletedAtBetween(OrderStatus.COMPLETED, periodStart, periodEnd))
                .isEqualByComparingTo(revenueBefore.add(placed.finalAmount()));
        assertThat(orderRepository.sumFinalAmountByStatusAndCompletedAtBetween(OrderStatus.COMPLETED,
                oldPlacement.minusSeconds(1), oldPlacement.plusSeconds(1))).isEqualByComparingTo(BigDecimal.ZERO);

        cartService.addToCart(new AddToCartRequest(product.getId(), 1));
        var cancellable = orderService.placeOrder(new PlaceOrderRequest(customer.getFullName(), "0900000000",
                customer.getEmail(), "Địa chỉ kiểm thử", "COD", null, customerNote));
        String reason = "R".repeat(500);
        var cancelled = orderService.customerCancelOrder(cancellable.id(), reason);
        assertThat(cancelled.notes()).contains(customerNote, reason);
        assertThat(orderRepository.findById(cancellable.id()).orElseThrow().getNotes()).hasSizeGreaterThan(1000);
    }

    @Autowired private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    private void setOrderPlacementTime(Long orderId, Instant placementTime) {
        jdbcTemplate.update("UPDATE orders SET created_at = ? WHERE id = ?", java.sql.Timestamp.from(placementTime), orderId);
    }

    private List<Throwable> runConcurrent(Runnable action) throws Exception {
        var executor = Executors.newFixedThreadPool(2);
        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);
        List<Throwable> failures = Collections.synchronizedList(new ArrayList<>());
        Runnable worker = () -> {
            authenticate();
            ready.countDown();
            try {
                if (!start.await(5, TimeUnit.SECONDS)) throw new IllegalStateException("Concurrent test start timed out");
                action.run();
            } catch (Throwable failure) {
                failures.add(failure);
            } finally {
                SecurityContextHolder.clearContext();
            }
        };
        try {
            var first = executor.submit(worker);
            var second = executor.submit(worker);
            assertThat(ready.await(5, TimeUnit.SECONDS)).isTrue();
            start.countDown();
            first.get(15, TimeUnit.SECONDS);
            second.get(15, TimeUnit.SECONDS);
            return failures;
        } finally {
            executor.shutdownNow();
        }
    }

    private void authenticate() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(customer.getEmail(), "test", List.of()));
    }
}
