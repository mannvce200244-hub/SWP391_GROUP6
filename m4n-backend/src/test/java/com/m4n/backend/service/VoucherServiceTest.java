package com.m4n.backend.service;

import com.m4n.backend.dto.request.ApplyVoucherRequest;
import com.m4n.backend.dto.response.VoucherValidationResponse;
import com.m4n.backend.entity.Voucher;
import com.m4n.backend.mapper.CartMapper;
import com.m4n.backend.repository.VoucherRepository;
import com.m4n.backend.serviceImpl.VoucherServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class VoucherServiceTest {

    @Mock
    private VoucherRepository voucherRepository;

    private VoucherService voucherService;

    @BeforeEach
    void setUp() {
        CartMapper cartMapper = new CartMapper();
        voucherService = new VoucherServiceImpl(voucherRepository, cartMapper);
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
        ApplyVoucherRequest request = new ApplyVoucherRequest("M4N10", new BigDecimal("2000000.00"));
        VoucherValidationResponse response = voucherService.validateAndCalculate(request);

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
        ApplyVoucherRequest request = new ApplyVoucherRequest("M4N10", new BigDecimal("500000.00"));
        VoucherValidationResponse response = voucherService.validateAndCalculate(request);

        assertThat(response.isValid()).isFalse();
        assertThat(response.discountAmount()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(response.finalAmount()).isEqualByComparingTo(new BigDecimal("500000.00"));
        assertThat(response.message()).contains("chưa đạt giá trị tối thiểu");
    }

    @Test
    @DisplayName("Should return invalid result when voucher code does not exist")
    void shouldReturnInvalidWhenVoucherDoesNotExist() {
        when(voucherRepository.findByCodeIgnoreCase("INVALID")).thenReturn(Optional.empty());

        ApplyVoucherRequest request = new ApplyVoucherRequest("INVALID", new BigDecimal("1500000.00"));
        VoucherValidationResponse response = voucherService.validateAndCalculate(request);

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

        ApplyVoucherRequest request = new ApplyVoucherRequest("EXPIRED", new BigDecimal("500000.00"));
        VoucherValidationResponse response = voucherService.validateAndCalculate(request);

        assertThat(response.isValid()).isFalse();
        assertThat(response.message()).contains("không thể sử dụng");
    }

    @Test
    @DisplayName("getActiveVoucherOrThrow should throw exception on non-existent code")
    void getActiveVoucherOrThrow_shouldThrowOnNonExistent() {
        when(voucherRepository.findByCodeIgnoreCase("NOTFOUND")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> voucherService.getActiveVoucherOrThrow("NOTFOUND"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("không tồn tại");
    }
}
