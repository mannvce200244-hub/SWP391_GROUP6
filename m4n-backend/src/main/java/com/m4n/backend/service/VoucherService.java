package com.m4n.backend.service;

import com.m4n.backend.dto.request.CreateVoucherRequest;
import com.m4n.backend.dto.request.UpdateVoucherRequest;
import com.m4n.backend.dto.response.VoucherResponse;
import com.m4n.backend.dto.response.DiscountCalculationResponse;
import com.m4n.backend.dto.response.VoucherValidationResponse;
import com.m4n.backend.entity.PromotionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;

public interface VoucherService {

    DiscountCalculationResponse calculateDiscounts(String voucherCode, BigDecimal orderAmount, int quantity);

    DiscountCalculationResponse consumeDiscounts(String voucherCode, BigDecimal orderAmount, int quantity);

    void releaseUsage(String voucherCode);

    VoucherValidationResponse calculateShippingDiscount(String code, BigDecimal shippingFee, BigDecimal subtotal, int quantity);

    VoucherValidationResponse consumeShippingDiscount(String code, BigDecimal shippingFee, BigDecimal subtotal, int quantity);

    Page<VoucherResponse> searchVouchers(String search, PromotionType type, Boolean isActive, String state, Pageable pageable);

    VoucherResponse createVoucher(CreateVoucherRequest request);

    VoucherResponse updateVoucher(Long id, UpdateVoucherRequest request);

    void deleteVoucher(Long id);
}
