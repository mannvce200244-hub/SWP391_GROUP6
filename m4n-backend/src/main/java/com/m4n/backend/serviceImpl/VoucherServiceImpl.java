package com.m4n.backend.serviceImpl;

import com.m4n.backend.dto.request.CreateVoucherRequest;
import com.m4n.backend.dto.request.UpdateVoucherRequest;
import com.m4n.backend.dto.response.VoucherResponse;
import com.m4n.backend.dto.response.VoucherValidationResponse;
import com.m4n.backend.entity.Voucher;
import com.m4n.backend.exception.ResourceInUseException;
import com.m4n.backend.exception.ResourceNotFoundException;
import com.m4n.backend.mapper.CartMapper;
import com.m4n.backend.repository.InvoiceRepository;
import com.m4n.backend.repository.OrderRepository;
import com.m4n.backend.repository.VoucherRepository;
import com.m4n.backend.service.VoucherService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class VoucherServiceImpl implements VoucherService {

    private final VoucherRepository voucherRepository;
    private final OrderRepository orderRepository;
    private final InvoiceRepository invoiceRepository;
    private final CartMapper cartMapper;

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

    @Override
    public List<VoucherResponse> getAllVouchers() {
        return voucherRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::mapToVoucherResponse)
                .toList();
    }

    @Override
    @Transactional
    public VoucherResponse createVoucher(CreateVoucherRequest request) {
        String code = request.code().trim().toUpperCase();
        if (voucherRepository.existsByCodeIgnoreCase(code)) {
            throw new IllegalArgumentException("Mã voucher đã tồn tại: " + code);
        }

        Voucher voucher = Voucher.builder()
                .code(code)
                .discountRate(request.discountRate())
                .minimumOrderValue(request.minimumOrderValue())
                .description(request.description() != null ? request.description().trim() : null)
                .isActive(request.isActive() == null || request.isActive())
                .build();

        Voucher saved = voucherRepository.save(voucher);
        return mapToVoucherResponse(saved);
    }

    @Override
    @Transactional
    public VoucherResponse updateVoucher(Long id, UpdateVoucherRequest request) {
        Voucher voucher = voucherRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Voucher không tồn tại: " + id));

        voucher.setDiscountRate(request.discountRate());
        voucher.setMinimumOrderValue(request.minimumOrderValue());
        if (request.description() != null) {
            voucher.setDescription(request.description().trim());
        }
        if (request.isActive() != null) {
            voucher.setActive(request.isActive());
        }

        Voucher updated = voucherRepository.save(voucher);
        return mapToVoucherResponse(updated);
    }

    @Override
    @Transactional
    public void deleteVoucher(Long id) {
        Voucher voucher = voucherRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Voucher không tồn tại: " + id));

        boolean inUseInOrders = orderRepository.existsByVoucherCodeIgnoreCase(voucher.getCode());
        boolean inUseInInvoices = invoiceRepository.existsByVoucherCodeIgnoreCase(voucher.getCode());
        if (inUseInOrders || inUseInInvoices) {
            throw new ResourceInUseException("Không thể xóa mã giảm giá '" + voucher.getCode() +
                    "' vì đã từng được áp dụng trong đơn hàng hoặc hóa đơn. Vui lòng chuyển sang trạng thái ngưng kích hoạt.");
        }

        voucherRepository.delete(voucher);
    }

    private VoucherResponse mapToVoucherResponse(Voucher v) {
        return new VoucherResponse(
                v.getId(),
                v.getCode(),
                v.getDiscountRate(),
                v.getMinimumOrderValue(),
                v.isActive(),
                v.getDescription(),
                v.getCreatedAt(),
                v.getUpdatedAt()
        );
    }
}
