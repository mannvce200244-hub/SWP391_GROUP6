package com.m4n.backend.service;

import com.m4n.backend.dto.request.PosSaleItemRequest;
import com.m4n.backend.dto.request.PosSaleRequest;
import com.m4n.backend.dto.response.PosSaleResponse;
import com.m4n.backend.entity.Category;
import com.m4n.backend.entity.Inventory;
import com.m4n.backend.entity.Order;
import com.m4n.backend.entity.OrderItem;
import com.m4n.backend.entity.OrderStatus;
import com.m4n.backend.entity.Product;
import com.m4n.backend.entity.User;
import com.m4n.backend.entity.Voucher;
import com.m4n.backend.exception.InsufficientStockException;
import com.m4n.backend.repository.CategoryRepository;
import com.m4n.backend.repository.InventoryRepository;
import com.m4n.backend.repository.InvoiceRepository;
import com.m4n.backend.repository.OrderRepository;
import com.m4n.backend.repository.ProductRepository;
import com.m4n.backend.repository.UserRepository;
import com.m4n.backend.repository.VoucherRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class OrderInventoryConcurrencyIntegrationTest {

    @Autowired
    private OrderService orderService;

    @Autowired
    private PosService posService;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private InventoryRepository inventoryRepository;

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired private VoucherRepository voucherRepository;
    @Autowired private JdbcTemplate jdbcTemplate;
    @Autowired private PlatformTransactionManager transactionManager;

    private final List<Long> orderIds = new ArrayList<>();
    private final List<String> orderCodes = new ArrayList<>();
    private final List<Long> invoiceIds = new ArrayList<>();
    private Product product;
    private Inventory inventory;
    private User customer;

    @BeforeEach
    void setUp() {
        Category category = categoryRepository.findAll().stream().findFirst().orElseThrow();
        customer = userRepository.findByEmailIgnoreCase("customer@m4n.vn").orElseThrow();
        String suffix = UUID.randomUUID().toString().replace("-", "").substring(0, 10).toUpperCase();
        product = productRepository.save(Product.builder()
                .code("RACE-" + suffix)
                .barcode("RACEBAR-" + suffix)
                .name("Nhạc cụ kiểm thử đồng thời " + suffix)
                .price(new BigDecimal("1000000"))
                .category(category)
                .media(new ArrayList<>())
                .isActive(true)
                .build());
        inventory = inventoryRepository.save(Inventory.builder()
                .product(product)
                .quantity(5)
                .build());
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
        orderCodes.forEach(code -> jdbcTemplate.update(
                "DELETE FROM notifications WHERE user_id = ? AND message LIKE ?",
                customer.getId(), "%" + code + "%"));
        invoiceIds.forEach(invoiceRepository::deleteById);
        orderIds.forEach(orderRepository::deleteById);
        if (product != null) jdbcTemplate.update("DELETE FROM inventory_movements WHERE product_id = ?", product.getId());
        if (inventory != null && inventory.getId() != null && inventoryRepository.existsById(inventory.getId())) {
            inventoryRepository.deleteById(inventory.getId());
        }
        if (product != null && product.getId() != null && productRepository.existsById(product.getId())) {
            productRepository.deleteById(product.getId());
        }
    }

    @Test
    @DisplayName("PostgreSQL race: two retries on one waiting order deduct inventory exactly once")
    void simultaneousRetries_deductExactlyOnce() throws Exception {
        Order order = createOrder(OrderStatus.OUT_OF_STOCK_WAITING, 2);
        List<Throwable> failures = runConcurrent(
                () -> orderService.retryOrderConfirmation(order.getId()),
                () -> orderService.retryOrderConfirmation(order.getId())
        );

        assertThat(failures).hasSize(1);
        assertThat(failures.get(0)).isInstanceOf(IllegalArgumentException.class);
        assertThat(orderRepository.findById(order.getId()).orElseThrow().getStatus()).isEqualTo(OrderStatus.CONFIRMED);
        assertThat(currentQuantity()).isEqualTo(3);
    }

    @Test
    @DisplayName("PostgreSQL race: POS sale versus online retry never oversells")
    void posSaleVersusRetry_neverMakesInventoryNegative() throws Exception {
        inventory.setQuantity(1);
        inventoryRepository.save(inventory);
        Order order = createOrder(OrderStatus.OUT_OF_STOCK_WAITING, 1);
        List<Throwable> failures = runConcurrent(
                () -> {
                    SecurityContextHolder.getContext().setAuthentication(
                            new UsernamePasswordAuthenticationToken("pos@m4n.vn", "test", List.of())
                    );
                    try {
                        PosSaleResponse response = posService.finalizeSale(PosSaleRequest.builder()
                                .items(List.of(new PosSaleItemRequest(product.getId(), 1)))
                                .paymentMethod("BANK_TRANSFER")
                                .build());
                        synchronized (invoiceIds) {
                            invoiceIds.add(response.getInvoiceId());
                        }
                    } finally {
                        SecurityContextHolder.clearContext();
                    }
                },
                () -> orderService.retryOrderConfirmation(order.getId())
        );

        assertThat(failures).hasSizeLessThanOrEqualTo(1);
        if (!failures.isEmpty()) {
            assertThat(failures.get(0)).isInstanceOfAny(InsufficientStockException.class, IllegalArgumentException.class);
        }
        assertThat(currentQuantity()).isZero();
        OrderStatus finalStatus = orderRepository.findById(order.getId()).orElseThrow().getStatus();
        assertThat(finalStatus).isIn(OrderStatus.CONFIRMED, OrderStatus.OUT_OF_STOCK_WAITING);
        assertThat(invoiceIds.size() + (finalStatus == OrderStatus.CONFIRMED ? 1 : 0)).isEqualTo(1);
    }

    @Test
    @DisplayName("PostgreSQL race: cancel versus retry ends cancelled with original stock")
    void cancelVersusRetry_preservesStockInvariant() throws Exception {
        Order order = createOrder(OrderStatus.OUT_OF_STOCK_WAITING, 2);
        runConcurrent(
                () -> orderService.staffCancelOrder(order.getId(), "Kiểm thử tranh chấp"),
                () -> orderService.retryOrderConfirmation(order.getId())
        );

        assertThat(orderRepository.findById(order.getId()).orElseThrow().getStatus()).isEqualTo(OrderStatus.CANCELLED);
        assertThat(currentQuantity()).isEqualTo(5);
    }

    @Test
    @DisplayName("PostgreSQL race: cancelling a confirmed order twice restores stock once")
    void simultaneousCancellation_restoresExactlyOnce() throws Exception {
        inventory.setQuantity(3);
        inventoryRepository.save(inventory);
        Order order = createOrder(OrderStatus.CONFIRMED, 2);
        List<Throwable> failures = runConcurrent(
                () -> orderService.staffCancelOrder(order.getId(), "Hủy thứ nhất"),
                () -> orderService.staffCancelOrder(order.getId(), "Hủy thứ hai")
        );

        assertThat(failures).hasSize(1);
        assertThat(failures.get(0)).isInstanceOf(IllegalArgumentException.class);
        assertThat(orderRepository.findById(order.getId()).orElseThrow().getStatus()).isEqualTo(OrderStatus.CANCELLED);
        assertThat(currentQuantity()).isEqualTo(5);
    }

    @Test
    void posSaleAndConfirmedCancellationWithSharedVoucherFollowOneLockOrder() throws Exception {
        Voucher voucher = voucherRepository.save(Voucher.builder()
                .code("LOCK-" + UUID.randomUUID().toString().replace("-", ""))
                .discountRate(new BigDecimal("0.10")).minimumOrderValue(BigDecimal.ZERO)
                .usedCount(1).usageLimit(10).build());
        try {
            inventory.setQuantity(3);
            inventoryRepository.save(inventory);
            Order order = createOrder(OrderStatus.CONFIRMED, 1);
            order.setVoucherCode(voucher.getCode());
            order.setDiscountAmount(new BigDecimal("100000"));
            order.setManualDiscountAmount(new BigDecimal("100000"));
            order.setFinalAmount(new BigDecimal("900000"));
            orderRepository.save(order);
            CountDownLatch inventoryHeld = new CountDownLatch(1);
            CountDownLatch posTransactionStarted = new CountDownLatch(1);
            AtomicInteger posBackendPid = new AtomicInteger();
            TransactionTemplate transactions = new TransactionTemplate(transactionManager);

            List<Throwable> failures = runConcurrent(
                    () -> transactions.executeWithoutResult(transaction -> {
                        inventoryRepository.findByProductIdWithLock(product.getId()).orElseThrow();
                        inventoryHeld.countDown();
                        await(posTransactionStarted);
                        awaitPostgresLockWait(posBackendPid.get());
                        orderService.staffCancelOrder(order.getId(), "Kiểm thử thứ tự khóa POS/voucher");
                    }),
                    () -> {
                        await(inventoryHeld);
                        SecurityContextHolder.getContext().setAuthentication(
                                new UsernamePasswordAuthenticationToken("pos@m4n.vn", "test", List.of()));
                        try {
                            transactions.executeWithoutResult(transaction -> {
                                posBackendPid.set(jdbcTemplate.queryForObject("SELECT pg_backend_pid()", Integer.class));
                                posTransactionStarted.countDown();
                                PosSaleResponse sale = posService.finalizeSale(PosSaleRequest.builder()
                                        .items(List.of(new PosSaleItemRequest(product.getId(), 1)))
                                        .voucherCode(voucher.getCode()).paymentMethod("BANK_TRANSFER").build());
                                synchronized (invoiceIds) { invoiceIds.add(sale.getInvoiceId()); }
                            });
                        } finally {
                            SecurityContextHolder.clearContext();
                        }
                    });

            assertThat(failures).isEmpty();
            assertThat(orderRepository.findById(order.getId()).orElseThrow().getStatus()).isEqualTo(OrderStatus.CANCELLED);
            assertThat(currentQuantity()).isEqualTo(3);
            assertThat(invoiceIds).hasSize(1);
            assertThat(voucherRepository.findById(voucher.getId()).orElseThrow().getUsedCount()).isEqualTo(1);
        } finally {
            voucherRepository.deleteById(voucher.getId());
        }
    }

    private void await(CountDownLatch latch) {
        try {
            if (!latch.await(5, TimeUnit.SECONDS)) throw new IllegalStateException("Concurrent fixture timed out");
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Concurrent fixture interrupted", exception);
        }
    }

    private void awaitPostgresLockWait(int backendPid) {
        long deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(5);
        while (System.nanoTime() < deadline) {
            Boolean waiting = jdbcTemplate.queryForObject(
                    "SELECT EXISTS (SELECT 1 FROM pg_locks WHERE pid = ? AND NOT granted)", Boolean.class, backendPid);
            if (Boolean.TRUE.equals(waiting)) return;
            try {
                Thread.sleep(10);
            } catch (InterruptedException exception) {
                Thread.currentThread().interrupt();
                throw new IllegalStateException("Lock-wait fixture interrupted", exception);
            }
        }
        throw new IllegalStateException("POS did not reach its PostgreSQL inventory lock wait");
    }

    private Order createOrder(OrderStatus status, int quantity) {
        String suffix = UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase();
        Order order = Order.builder()
                .orderCode("RACE-ORDER-" + suffix)
                .user(customer)
                .customerName(customer.getFullName())
                .customerPhone("0900000000")
                .customerEmail(customer.getEmail())
                .shippingAddress("Địa chỉ kiểm thử")
                .totalAmount(product.getPrice().multiply(BigDecimal.valueOf(quantity)))
                .discountAmount(BigDecimal.ZERO)
                .finalAmount(product.getPrice().multiply(BigDecimal.valueOf(quantity)))
                .status(status)
                .paymentMethod("COD")
                .isPaid(false)
                .items(new ArrayList<>())
                .build();
        order.getItems().add(OrderItem.builder()
                .order(order)
                .product(product)
                .productName(product.getName())
                .productCode(product.getCode())
                .price(product.getPrice())
                .quantity(quantity)
                .build());
        Order saved = orderRepository.save(order);
        orderIds.add(saved.getId());
        orderCodes.add(saved.getOrderCode());
        return saved;
    }

    private int currentQuantity() {
        return inventoryRepository.findByProductId(product.getId()).orElseThrow().getQuantity();
    }

    private List<Throwable> runConcurrent(ThrowingAction first, ThrowingAction second) throws Exception {
        ExecutorService executor = Executors.newFixedThreadPool(2);
        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);
        List<Throwable> failures = Collections.synchronizedList(new ArrayList<>());
        try {
            Future<?> firstFuture = executor.submit(() -> executeWhenReleased(first, ready, start, failures));
            Future<?> secondFuture = executor.submit(() -> executeWhenReleased(second, ready, start, failures));
            assertThat(ready.await(5, TimeUnit.SECONDS)).isTrue();
            start.countDown();
            firstFuture.get(10, TimeUnit.SECONDS);
            secondFuture.get(10, TimeUnit.SECONDS);
            return failures;
        } finally {
            executor.shutdownNow();
        }
    }

    private void executeWhenReleased(
            ThrowingAction action,
            CountDownLatch ready,
            CountDownLatch start,
            List<Throwable> failures
    ) {
        ready.countDown();
        try {
            start.await();
            action.run();
        } catch (Throwable throwable) {
            failures.add(throwable);
        }
    }

    @FunctionalInterface
    private interface ThrowingAction {
        void run() throws Exception;
    }
}
