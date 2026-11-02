package com.m4n.backend.service;

import com.m4n.backend.entity.PromotionType;
import com.m4n.backend.entity.Voucher;
import com.m4n.backend.repository.VoucherRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Transactional
class PromotionIntegrationTest {

    @Autowired private VoucherService voucherService;
    @Autowired private VoucherRepository voucherRepository;

    @BeforeEach
    void isolateAutomaticPromotionFixtures() {
        // The transaction rolls these changes back, leaving local development data intact.
        voucherRepository.findAll().stream()
                .filter(voucher -> voucher.getPromotionType() == PromotionType.AUTOMATIC_ORDER)
                .forEach(voucher -> voucher.setActive(false));
        voucherRepository.flush();
    }

    @Test
    void automaticPromotionRequiresBothConfiguredThresholdsAtTheirBoundaries() {
        Voucher automatic = automatic("0.10", "1000", 3);

        assertThat(voucherService.calculateDiscounts(null, new BigDecimal("999"), 3).automaticPromotion()).isNull();
        assertThat(voucherService.calculateDiscounts(null, new BigDecimal("1000"), 2).automaticPromotion()).isNull();
        var eligible = voucherService.calculateDiscounts(null, new BigDecimal("1000"), 3);
        assertThat(eligible.automaticPromotion().code()).isEqualTo(automatic.getCode());
        assertThat(eligible.automaticDiscountAmount()).isEqualByComparingTo("100");
        assertThat(eligible.finalAmount()).isEqualByComparingTo("900");
    }

    @Test
    void automaticPromotionChoosesHighestRoundedDiscountAndLowestIdForAnEffectiveTie() {
        Voucher first = automatic("0.1010", "0", null);
        automatic("0.1040", "0", null);
        Voucher inactive = automatic("0.90", "0", null);
        inactive.setActive(false);

        var result = voucherService.calculateDiscounts(null, new BigDecimal("100"), 1);
        assertThat(result.automaticPromotion().code()).isEqualTo(first.getCode());
        assertThat(result.automaticDiscountAmount()).isEqualByComparingTo("10");

        Voucher best = automatic("0.15", "0", null);
        result = voucherService.calculateDiscounts(null, new BigDecimal("100"), 1);
        assertThat(result.automaticPromotion().code()).isEqualTo(best.getCode());
        assertThat(result.automaticDiscountAmount()).isEqualByComparingTo("15");
    }

    @Test
    void exhaustedExpiredAndFuturePromotionsDoNotOverrideAnEligiblePromotion() {
        Voucher eligible = automatic("0.10", "0", null);
        Voucher exhausted = automatic("0.90", "0", null);
        exhausted.setUsageLimit(1);
        exhausted.setUsedCount(1);
        Voucher expired = automatic("0.80", "0", null);
        expired.setValidUntil(Instant.now().minusSeconds(60));
        Voucher future = automatic("0.70", "0", null);
        future.setValidFrom(Instant.now().plusSeconds(60));

        assertThat(voucherService.calculateDiscounts(null, new BigDecimal("100"), 1).automaticPromotion().code())
                .isEqualTo(eligible.getCode());
    }

    @Test
    void consumingAutomaticPromotionHonorsItsUsageLimitAndPreviewDoesNotConsume() {
        Voucher automatic = automatic("0.10", "0", null);
        automatic.setUsageLimit(1);

        voucherService.calculateDiscounts(null, new BigDecimal("100"), 1);
        assertThat(automatic.getUsedCount()).isZero();
        assertThat(voucherService.consumeDiscounts(null, new BigDecimal("100"), 1).automaticPromotion()).isNotNull();
        assertThat(automatic.getUsedCount()).isEqualTo(1);
        assertThat(voucherService.consumeDiscounts(null, new BigDecimal("100"), 1).automaticPromotion()).isNull();
    }

    private Voucher automatic(String rate, String minimumAmount, Integer minimumQuantity) {
        return voucherRepository.save(Voucher.builder()
                .code("AUTO-" + UUID.randomUUID().toString().replace("-", ""))
                .promotionType(PromotionType.AUTOMATIC_ORDER)
                .discountRate(new BigDecimal(rate))
                .minimumOrderValue(new BigDecimal(minimumAmount))
                .minimumQuantity(minimumQuantity)
                .build());
    }
}
