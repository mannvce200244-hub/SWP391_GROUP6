package com.m4n.backend.service;

import com.m4n.backend.dto.response.VoucherValidationResponse;
import com.m4n.backend.entity.Voucher;
import com.m4n.backend.entity.PromotionType;
import com.m4n.backend.dto.request.UpdateVoucherRequest;
import com.m4n.backend.mapper.CartMapper;
import com.m4n.backend.repository.VoucherRepository;
import com.m4n.backend.service.serviceImpl.VoucherServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;
import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.never;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;

@ExtendWith(MockitoExtension.class)
class VoucherServiceTest {

    @Mock
    private VoucherRepository voucherRepository;

    @Mock
    private com.m4n.backend.repository.OrderRepository orderRepository;

    @Mock
    private com.m4n.backend.repository.InvoiceRepository invoiceRepository;

    private VoucherService voucherService;

    @BeforeEach
    void setUp() {
        CartMapper cartMapper = new CartMapper();
        voucherService = new VoucherServiceImpl(voucherRepository, orderRepository, invoiceRepository, cartMapper);
    }

    @Test
    @DisplayName("Should apply valid voucher when order amount meets minimum value (BR-VOUCHER-01)")
    void shouldApplyValidVoucherWhenOrderAmountMeetsMinimum() {
        Voucher voucher = Voucher.builder()
                .id(1L)
                .code("M4N10")
                .discountRate(new BigDecimal("0.1000"))
                .minimumOrderValue(new BigDecimal("1000000.00"))
                .isActive(true)
                .description("Giảm 10%")
                .build();

        when(voucherRepository.findByCodeIgnoreCase("M4N10")).thenReturn(Optional.of(voucher));

        // Order amount: 2,000,000 VND
        VoucherValidationResponse response = voucherService.calculateDiscounts(
                "M4N10", new BigDecimal("2000000.00"), 1).manualVoucher();

        assertThat(response.isValid()).isTrue();
        // 2,000,000 * 0.10 = 200,000 VND discount
        assertThat(response.discountAmount()).isEqualByComparingTo(new BigDecimal("200000"));
        // Final: 2,000,000 - 200,000 = 1,800,000 VND
        assertThat(response.finalAmount()).isEqualByComparingTo(new BigDecimal("1800000"));
    }

    @Test
    @DisplayName("Should reject voucher when order amount is below minimum order value (BR-VOUCHER-01)")
    void shouldRejectVoucherWhenOrderAmountBelowMinimum() {
        Voucher voucher = Voucher.builder()
                .id(1L)
                .code("M4N10")
                .discountRate(new BigDecimal("0.1000"))
                .minimumOrderValue(new BigDecimal("1000000.00"))
                .isActive(true)
                .build();

        when(voucherRepository.findByCodeIgnoreCase("M4N10")).thenReturn(Optional.of(voucher));

        // Order amount: 500,000 VND (below 1,000,000)
        VoucherValidationResponse response = voucherService.calculateDiscounts(
                "M4N10", new BigDecimal("500000.00"), 1).manualVoucher();

        assertThat(response.isValid()).isFalse();
        assertThat(response.discountAmount()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(response.finalAmount()).isEqualByComparingTo(new BigDecimal("500000.00"));
        assertThat(response.message()).contains("chưa đạt giá trị tối thiểu");
    }

    @Test
    @DisplayName("Should return invalid result when voucher code does not exist")
    void shouldReturnInvalidWhenVoucherDoesNotExist() {
        when(voucherRepository.findByCodeIgnoreCase("INVALID")).thenReturn(Optional.empty());

        VoucherValidationResponse response = voucherService.calculateDiscounts(
                "INVALID", new BigDecimal("1500000.00"), 1).manualVoucher();

        assertThat(response.isValid()).isFalse();
        assertThat(response.message()).contains("không tồn tại");
    }

    @Test
    @DisplayName("Should return invalid result when voucher is deactivated")
    void shouldReturnInvalidWhenVoucherIsInactive() {
        Voucher voucher = Voucher.builder()
                .id(2L)
                .code("EXPIRED")
                .discountRate(new BigDecimal("0.2000"))
                .minimumOrderValue(new BigDecimal("100000.00"))
                .isActive(false)
                .build();

        when(voucherRepository.findByCodeIgnoreCase("EXPIRED")).thenReturn(Optional.of(voucher));

        VoucherValidationResponse response = voucherService.calculateDiscounts(
                "EXPIRED", new BigDecimal("500000.00"), 1).manualVoucher();

        assertThat(response.isValid()).isFalse();
        assertThat(response.message()).contains("không thể sử dụng");
    }

    @Test
    @DisplayName("Should reject expired and exhausted vouchers")
    void shouldRejectExpiredAndExhaustedVoucher() {
        Voucher expired = Voucher.builder()
                .code("OLD10").discountRate(new BigDecimal("0.1000"))
                .minimumOrderValue(BigDecimal.ZERO).isActive(true)
                .validUntil(Instant.now().minusSeconds(60)).build();
        when(voucherRepository.findByCodeIgnoreCase("OLD10")).thenReturn(Optional.of(expired));
        assertThat(voucherService.calculateDiscounts("OLD10", new BigDecimal("100000"), 1).manualVoucher())
                .extracting(VoucherValidationResponse::isValid, VoucherValidationResponse::message)
                .containsExactly(false, "Mã voucher đã hết hạn.");

        Voucher exhausted = Voucher.builder()
                .code("LIMIT1").discountRate(new BigDecimal("0.1000"))
                .minimumOrderValue(BigDecimal.ZERO).isActive(true)
                .usageLimit(1).usedCount(1).build();
        when(voucherRepository.findByCodeIgnoreCase("LIMIT1")).thenReturn(Optional.of(exhausted));
        assertThat(voucherService.calculateDiscounts("LIMIT1", new BigDecimal("100000"), 1).manualVoucher().message())
                .contains("hết lượt");
    }

    @Test
    @DisplayName("Voucher consumption should increment under repository lock")
    void consumeVoucher_shouldIncrementUsage() {
        Voucher voucher = Voucher.builder()
                .code("LIMIT10").discountRate(new BigDecimal("0.1000"))
                .minimumOrderValue(BigDecimal.ZERO).isActive(true)
                .usageLimit(10).usedCount(2).build();
        when(voucherRepository.findByCodeIgnoreCaseWithLock("LIMIT10")).thenReturn(Optional.of(voucher));
        when(voucherRepository.save(voucher)).thenReturn(voucher);

        VoucherValidationResponse response = voucherService.consumeDiscounts("LIMIT10", new BigDecimal("100000"), 1).manualVoucher();

        assertThat(response.isValid()).isTrue();
        assertThat(voucher.getUsedCount()).isEqualTo(3);
        org.mockito.Mockito.verify(voucherRepository).save(voucher);
    }

    @Test
    @DisplayName("Consuming discounts rejects a missing manual voucher before persisting usage")
    void consumeDiscounts_shouldThrowOnNonExistentCode() {
        when(voucherRepository.findByCodeIgnoreCaseWithLock("NOTFOUND")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> voucherService.consumeDiscounts("NOTFOUND", BigDecimal.TEN, 1))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("không tồn tại");
    }

    @Test
    @DisplayName("createVoucher should succeed and normalize code")
    void createVoucher_shouldSucceed() {
        com.m4n.backend.dto.request.CreateVoucherRequest request = new com.m4n.backend.dto.request.CreateVoucherRequest(
                "tet2026",
                new BigDecimal("0.1500"),
                new BigDecimal("500000.00"),
                true,
                "Giảm 15% Tết"
        );

        when(voucherRepository.existsByCodeIgnoreCase("TET2026")).thenReturn(false);
        when(voucherRepository.save(org.mockito.ArgumentMatchers.any(Voucher.class))).thenAnswer(i -> {
            Voucher v = i.getArgument(0);
            v.setId(10L);
            return v;
        });

        com.m4n.backend.dto.response.VoucherResponse response = voucherService.createVoucher(request);
        assertThat(response.code()).isEqualTo("TET2026");
        assertThat(response.discountRate()).isEqualByComparingTo(new BigDecimal("0.1500"));
    }

    @Test
    @DisplayName("createVoucher with existing code should throw exception")
    void createVoucher_withDuplicateCode_shouldThrow() {
        com.m4n.backend.dto.request.CreateVoucherRequest request = new com.m4n.backend.dto.request.CreateVoucherRequest(
                "DUPLICATE",
                new BigDecimal("0.1000"),
                BigDecimal.ZERO,
                true,
                null
        );

        when(voucherRepository.existsByCodeIgnoreCase("DUPLICATE")).thenReturn(true);

        assertThatThrownBy(() -> voucherService.createVoucher(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("đã tồn tại");
    }

    @Test
    @DisplayName("deleteVoucher should succeed when voucher is not used in any orders or invoices")
    void deleteVoucher_shouldSucceedWhenNotInUse() {
        Voucher voucher = Voucher.builder().id(5L).code("UNUSED10").build();
        when(voucherRepository.findByIdWithLock(5L)).thenReturn(Optional.of(voucher));
        when(orderRepository.existsByVoucherCodeIgnoreCase("UNUSED10")).thenReturn(false);
        when(invoiceRepository.existsByVoucherCodeIgnoreCase("UNUSED10")).thenReturn(false);

        voucherService.deleteVoucher(5L);

        org.mockito.Mockito.verify(voucherRepository).delete(voucher);
    }

    @Test
    @DisplayName("deleteVoucher should throw ResourceInUseException when voucher is used in orders")
    void deleteVoucher_shouldThrowWhenUsedInOrders() {
        Voucher voucher = Voucher.builder().id(6L).code("USED_ORDER").build();
        when(voucherRepository.findByIdWithLock(6L)).thenReturn(Optional.of(voucher));
        when(orderRepository.existsByVoucherCodeIgnoreCase("USED_ORDER")).thenReturn(true);

        assertThatThrownBy(() -> voucherService.deleteVoucher(6L))
                .isInstanceOf(com.m4n.backend.exception.ResourceInUseException.class)
                .hasMessageContaining("đã từng được áp dụng trong đơn hàng hoặc hóa đơn");

        org.mockito.Mockito.verify(voucherRepository, org.mockito.Mockito.never()).delete(org.mockito.ArgumentMatchers.any());
    }

    @Test
    @DisplayName("deleteVoucher should throw ResourceInUseException when voucher is used in invoices")
    void deleteVoucher_shouldThrowWhenUsedInInvoices() {
        Voucher voucher = Voucher.builder().id(7L).code("USED_INV").build();
        when(voucherRepository.findByIdWithLock(7L)).thenReturn(Optional.of(voucher));
        when(orderRepository.existsByVoucherCodeIgnoreCase("USED_INV")).thenReturn(false);
        when(invoiceRepository.existsByVoucherCodeIgnoreCase("USED_INV")).thenReturn(true);

        assertThatThrownBy(() -> voucherService.deleteVoucher(7L))
                .isInstanceOf(com.m4n.backend.exception.ResourceInUseException.class)
                .hasMessageContaining("đã từng được áp dụng trong đơn hàng hoặc hóa đơn");

        org.mockito.Mockito.verify(voucherRepository, org.mockito.Mockito.never()).delete(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void manualAndAutomaticDiscountsUseTheSameSubtotalAndCapTheirCombinedAmount() {
        Voucher manual = Voucher.builder().id(1L).code("MANUAL75").discountRate(new BigDecimal("0.75"))
                .minimumOrderValue(BigDecimal.ZERO).build();
        Voucher automatic = Voucher.builder().id(2L).code("AUTO50").promotionType(PromotionType.AUTOMATIC_ORDER)
                .discountRate(new BigDecimal("0.50")).minimumOrderValue(BigDecimal.ZERO).build();
        when(voucherRepository.findByCodeIgnoreCase("MANUAL75")).thenReturn(Optional.of(manual));
        when(voucherRepository.findEligibleAutomaticPromotions(eq(PromotionType.AUTOMATIC_ORDER),
                eq(new BigDecimal("1001")), eq(2), any(), any())).thenReturn(List.of(automatic));

        var result = voucherService.calculateDiscounts("MANUAL75", new BigDecimal("1001"), 2);

        assertThat(result.manualDiscountAmount()).isEqualByComparingTo("751");
        assertThat(result.automaticDiscountAmount()).isEqualByComparingTo("250");
        assertThat(result.totalDiscountAmount()).isEqualByComparingTo("1001");
        assertThat(result.finalAmount()).isZero();
        verify(voucherRepository, never()).save(any());
    }

    @Test
    void fullManualDiscountDoesNotConsumeAnAutomaticPromotionWithZeroContribution() {
        Voucher manual = Voucher.builder().id(1L).code("FREE").discountRate(BigDecimal.ONE)
                .minimumOrderValue(BigDecimal.ZERO).usageLimit(5).build();
        when(voucherRepository.findByCodeIgnoreCaseWithLock("FREE")).thenReturn(Optional.of(manual));

        var result = voucherService.consumeDiscounts("FREE", new BigDecimal("1000"), 1);

        assertThat(result.automaticPromotion()).isNull();
        assertThat(result.automaticDiscountAmount()).isZero();
        assertThat(manual.getUsedCount()).isEqualTo(1);
        verify(voucherRepository, never()).findEligibleAutomaticPromotionsWithLock(any(), any(), anyInt(), any(), any());
    }

    @Test
    void automaticPromotionCannotBeSubmittedAsAManualVoucher() {
        Voucher automatic = Voucher.builder().id(1L).code("AUTO").promotionType(PromotionType.AUTOMATIC_ORDER)
                .discountRate(new BigDecimal("0.10")).minimumOrderValue(BigDecimal.ZERO).build();
        when(voucherRepository.findByCodeIgnoreCaseWithLock("AUTO")).thenReturn(Optional.of(automatic));

        assertThatThrownBy(() -> voucherService.consumeDiscounts("AUTO", new BigDecimal("1000"), 1))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("áp dụng tự động");
        verify(voucherRepository, never()).save(any());
    }

    @Test
    void manualVoucherChecksItsConfiguredQuantityThreshold() {
        Voucher manual = Voucher.builder().id(1L).code("QTY3").discountRate(new BigDecimal("0.10"))
                .minimumOrderValue(BigDecimal.ZERO).minimumQuantity(3).build();
        when(voucherRepository.findByCodeIgnoreCase("QTY3")).thenReturn(Optional.of(manual));

        assertThat(voucherService.calculateDiscounts("QTY3", new BigDecimal("1000"), 2).manualVoucher().isValid()).isFalse();
        assertThat(voucherService.calculateDiscounts("QTY3", new BigDecimal("1000"), 3).manualVoucher().isValid()).isTrue();
    }

    @Test
    void adminCannotReduceUsageLimitBelowTheCountReadUnderLock() {
        Voucher voucher = Voucher.builder().id(1L).code("USED").usedCount(3).build();
        when(voucherRepository.findByIdWithLock(1L)).thenReturn(Optional.of(voucher));
        UpdateVoucherRequest request = new UpdateVoucherRequest(new BigDecimal("0.1"), BigDecimal.ZERO,
                true, null, null, null, 2);

        assertThatThrownBy(() -> voucherService.updateVoucher(1L, request))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("số lượt đã dùng");
        verify(voucherRepository, never()).save(any());
    }

    @Test
    void automaticPromotionReferencedByHistoryCannotBeDeleted() {
        Voucher voucher = Voucher.builder().id(1L).code("AUTO_USED").promotionType(PromotionType.AUTOMATIC_ORDER).build();
        when(voucherRepository.findByIdWithLock(1L)).thenReturn(Optional.of(voucher));
        when(orderRepository.existsByAutomaticPromotionCodeIgnoreCase("AUTO_USED")).thenReturn(true);

        assertThatThrownBy(() -> voucherService.deleteVoucher(1L))
                .isInstanceOf(com.m4n.backend.exception.ResourceInUseException.class);
        verify(voucherRepository, never()).delete(any());
    }
}
