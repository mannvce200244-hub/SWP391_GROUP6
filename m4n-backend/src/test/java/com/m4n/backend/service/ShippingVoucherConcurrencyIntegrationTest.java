package com.m4n.backend.service;

import com.m4n.backend.dto.request.UpdateVoucherRequest;
import com.m4n.backend.entity.PromotionType;
import com.m4n.backend.entity.Voucher;
import com.m4n.backend.repository.VoucherRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import java.math.BigDecimal;
import java.util.*;
import java.util.concurrent.*;
import static org.assertj.core.api.Assertions.*;

@SpringBootTest
class ShippingVoucherConcurrencyIntegrationTest {
    @Autowired VoucherService service;
    @Autowired VoucherRepository repository;
    @Autowired PlatformTransactionManager transactionManager;
    Voucher voucher;

    @BeforeEach void fixture() {
        voucher = repository.save(Voucher.builder().code("SHIP-RACE-" + UUID.randomUUID().toString().replace("-", ""))
                .promotionType(PromotionType.SHIPPING).discountRate(BigDecimal.ZERO).fixedDiscountAmount(new BigDecimal("100"))
                .minimumOrderValue(BigDecimal.ZERO).usageLimit(1).build());
    }
    @AfterEach void clean() { repository.deleteById(voucher.getId()); }

    @Test void limitedShippingVoucherIsConsumedByOnlyOneConcurrentTransaction() throws Exception {
        var failures = race(() -> service.consumeShippingDiscount(voucher.getCode(), new BigDecimal("500"), new BigDecimal("1000"), 1),
                () -> service.consumeShippingDiscount(voucher.getCode(), new BigDecimal("500"), new BigDecimal("1000"), 1));
        assertThat(failures).hasSize(1);
        assertThat(failures.getFirst()).isInstanceOf(IllegalArgumentException.class).hasMessageContaining("hết lượt");
        assertThat(repository.findById(voucher.getId()).orElseThrow().getUsedCount()).isEqualTo(1);
    }

    @Test void adminTypeChangeWaitsForFirstUseAndCannotInvertVoucherMeaning() throws Exception {
        voucher.setPromotionType(PromotionType.MANUAL); voucher.setDiscountRate(new BigDecimal("0.10")); voucher.setFixedDiscountAmount(null);
        repository.save(voucher);
        CountDownLatch consumed = new CountDownLatch(1), adminStarted = new CountDownLatch(1);
        var failures = race(() -> new TransactionTemplate(transactionManager).executeWithoutResult(status -> {
            repository.findByIdWithLock(voucher.getId()).orElseThrow();
            service.consumeDiscounts(voucher.getCode(), new BigDecimal("1000"), 1);
            consumed.countDown();
            await(adminStarted);
        }), () -> {
            await(consumed);
            adminStarted.countDown();
            service.updateVoucher(voucher.getId(), new UpdateVoucherRequest(null, BigDecimal.ZERO, true,
                    "Đổi loại", null, null, 1, PromotionType.SHIPPING, null, new BigDecimal("100")));
        });
        assertThat(failures).hasSize(1);
        assertThat(failures.getFirst()).isInstanceOf(IllegalArgumentException.class).hasMessageContaining("đổi loại");
        var stored = repository.findById(voucher.getId()).orElseThrow();
        assertThat(stored.getPromotionType()).isEqualTo(PromotionType.MANUAL);
        assertThat(stored.getUsedCount()).isEqualTo(1);
    }

    private void await(CountDownLatch latch) {
        try { if (!latch.await(5, TimeUnit.SECONDS)) throw new IllegalStateException("Fixture timed out"); }
        catch (InterruptedException exception) { Thread.currentThread().interrupt(); throw new IllegalStateException(exception); }
    }
    private List<Throwable> race(Runnable first, Runnable second) throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(2);
        CountDownLatch ready = new CountDownLatch(2), start = new CountDownLatch(1);
        List<Throwable> failures = Collections.synchronizedList(new ArrayList<>());
        try {
            var futures = List.of(first, second).stream().map(action -> pool.submit(() -> {
                ready.countDown();
                try { start.await(); action.run(); } catch (Throwable failure) { failures.add(failure); }
            })).toList();
            assertThat(ready.await(5, TimeUnit.SECONDS)).isTrue(); start.countDown();
            for (var future : futures) future.get(15, TimeUnit.SECONDS);
            return failures;
        } finally { start.countDown(); pool.shutdownNow(); }
    }
}
