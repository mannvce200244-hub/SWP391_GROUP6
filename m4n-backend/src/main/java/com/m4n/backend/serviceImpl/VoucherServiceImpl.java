package com.m4n.backend.serviceImpl;

import com.m4n.backend.dto.request.ApplyVoucherRequest;
import com.m4n.backend.dto.response.VoucherValidationResponse;
import com.m4n.backend.entity.Voucher;
import com.m4n.backend.mapper.CartMapper;
import com.m4n.backend.repository.VoucherRepository;
import com.m4n.backend.service.VoucherService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class VoucherServiceImpl implements VoucherService {

    private final VoucherRepository voucherRepository;
    private final CartMapper cartMapper;

    @Override
    public VoucherValidationResponse validateAndCalculate(ApplyVoucherRequest request) {
        if (request == null) {
            return new VoucherValidationResponse(
                    null, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
                    cartMapper.formatPriceDisplay(BigDecimal.ZERO),
                    BigDecimal.ZERO,
                    cartMapper.formatPriceDisplay(BigDecimal.ZERO),
                    false, "Yêu cầu kiểm tra mã voucher không hợp lệ"
            );
        }
        return validateAndCalculate(request.voucherCode(), request.orderAmount());
    }

    @Override
    public VoucherValidationResponse validateAndCalculate(String voucherCode, BigDecimal orderAmount) {
        BigDecimal safeAmount = (orderAmount != null && orderAmount.compareTo(BigDecimal.ZERO) >= 0)
                ? orderAmount
                : BigDecimal.ZERO;

        if (voucherCode == null || voucherCode.trim().isEmpty()) {
            return new VoucherValidationResponse(
                    "", BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
                    cartMapper.formatPriceDisplay(BigDecimal.ZERO),
                    safeAmount,
                    cartMapper.formatPriceDisplay(safeAmount),
                    false, "Vui lòng nhập mã voucher"
            );
        }

        String normalizedCode = voucherCode.trim().toUpperCase();
        Optional<Voucher> voucherOpt = voucherRepository.findByCodeIgnoreCase(normalizedCode);

        if (voucherOpt.isEmpty()) {
            return new VoucherValidationResponse(
                    normalizedCode, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
                    cartMapper.formatPriceDisplay(BigDecimal.ZERO),
                    safeAmount,
                    cartMapper.formatPriceDisplay(safeAmount),
                    false, "Mã voucher không tồn tại."
            );
        }

        Voucher voucher = voucherOpt.get();
        if (!voucher.isActive()) {
            return new VoucherValidationResponse(
                    voucher.getCode(), voucher.getDiscountRate(), voucher.getMinimumOrderValue(), BigDecimal.ZERO,
                    cartMapper.formatPriceDisplay(BigDecimal.ZERO),
                    safeAmount,
                    cartMapper.formatPriceDisplay(safeAmount),
                    false, "Mã voucher hiện không thể sử dụng."
            );
        }

        // BR-VOUCHER-01: OrderAmount >= MinimumOrderValue
        if (voucher.getMinimumOrderValue() != null && safeAmount.compareTo(voucher.getMinimumOrderValue()) < 0) {
            String minDisplay = cartMapper.formatPriceDisplay(voucher.getMinimumOrderValue());
            return new VoucherValidationResponse(
                    voucher.getCode(), voucher.getDiscountRate(), voucher.getMinimumOrderValue(), BigDecimal.ZERO,
                    cartMapper.formatPriceDisplay(BigDecimal.ZERO),
                    safeAmount,
                    cartMapper.formatPriceDisplay(safeAmount),
                    false, "Đơn hàng chưa đạt giá trị tối thiểu (" + minDisplay + ")."
            );
        }

        // BR-VOUCHER-01: Discount = OrderAmount * DiscountRate
        BigDecimal discount = safeAmount.multiply(voucher.getDiscountRate()).setScale(0, RoundingMode.HALF_UP);
        // Ensure discount does not exceed orderAmount
        if (discount.compareTo(safeAmount) > 0) {
            discount = safeAmount;
        }

        // FinalAmount = OrderAmount - Discount
        BigDecimal finalAmount = safeAmount.subtract(discount);
        if (finalAmount.compareTo(BigDecimal.ZERO) < 0) {
            finalAmount = BigDecimal.ZERO;
        }

        return new VoucherValidationResponse(
                voucher.getCode(),
                voucher.getDiscountRate(),
                voucher.getMinimumOrderValue(),
                discount,
                cartMapper.formatPriceDisplay(discount),
                finalAmount,
                cartMapper.formatPriceDisplay(finalAmount),
                true,
                "Áp dụng mã giảm giá thành công: " + (voucher.getDescription() != null ? voucher.getDescription() : "")
        );
    }

    @Override
    public Voucher getActiveVoucherOrThrow(String voucherCode) {
        if (voucherCode == null || voucherCode.trim().isEmpty()) {
            throw new IllegalArgumentException("Mã voucher không được để trống");
        }
        String normalizedCode = voucherCode.trim().toUpperCase();
        Voucher voucher = voucherRepository.findByCodeIgnoreCase(normalizedCode)
                .orElseThrow(() -> new IllegalArgumentException("Mã voucher không tồn tại: " + normalizedCode));

        if (!voucher.isActive()) {
            throw new IllegalArgumentException("Mã voucher hiện không thể sử dụng.");
        }

        return voucher;
    }
}
