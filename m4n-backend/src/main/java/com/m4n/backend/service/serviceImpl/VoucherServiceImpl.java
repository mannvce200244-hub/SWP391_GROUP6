package com.m4n.backend.service.serviceImpl;

import com.m4n.backend.dto.request.CreateVoucherRequest;
import com.m4n.backend.dto.request.UpdateVoucherRequest;
import com.m4n.backend.dto.response.VoucherResponse;
import com.m4n.backend.dto.response.VoucherValidationResponse;
import com.m4n.backend.dto.response.DiscountCalculationResponse;
import com.m4n.backend.entity.Voucher;
import com.m4n.backend.entity.PromotionType;
import com.m4n.backend.exception.ResourceInUseException;
import com.m4n.backend.exception.ResourceNotFoundException;
import com.m4n.backend.mapper.CartMapper;
import com.m4n.backend.repository.InvoiceRepository;
import com.m4n.backend.repository.OrderRepository;
import com.m4n.backend.repository.VoucherRepository;
import com.m4n.backend.service.VoucherService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Locale;
import java.time.Instant;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class VoucherServiceImpl implements VoucherService {

    private final VoucherRepository voucherRepository;
    private final OrderRepository orderRepository;
    private final InvoiceRepository invoiceRepository;
    private final CartMapper cartMapper;

    @Override
    public DiscountCalculationResponse calculateDiscounts(String voucherCode, BigDecimal orderAmount, int quantity) {
        return calculateDiscounts(voucherCode, orderAmount, quantity, false);
    }

    @Override
    @Transactional
    public DiscountCalculationResponse consumeDiscounts(String voucherCode, BigDecimal orderAmount, int quantity) {
        return calculateDiscounts(voucherCode, orderAmount, quantity, true);
    }

    private DiscountCalculationResponse calculateDiscounts(String voucherCode, BigDecimal amount,
                                                           int quantity, boolean consume) {
        if (amount == null || amount.signum() < 0 || quantity < 0) {
            throw new IllegalArgumentException("Giá trị hoặc số lượng đơn hàng không hợp lệ.");
        }
        Instant now = Instant.now();
        VoucherValidationResponse manual = null;
        if (voucherCode != null && !voucherCode.isBlank()) {
            String code = voucherCode.trim().toUpperCase(Locale.ROOT);
            Voucher voucher = (consume ? voucherRepository.findByCodeIgnoreCaseWithLock(code)
                    : voucherRepository.findByCodeIgnoreCase(code)).orElse(null);
            if (voucher == null) {
                manual = new VoucherValidationResponse(code, BigDecimal.ZERO, BigDecimal.ZERO,
                        BigDecimal.ZERO, cartMapper.formatPriceDisplay(BigDecimal.ZERO), amount,
                        cartMapper.formatPriceDisplay(amount), false, "Mã voucher không tồn tại.");
            } else if (voucher.getPromotionType() != PromotionType.MANUAL) {
                manual = invalidVoucherResponse(voucher, amount,
                        voucher.getPromotionType() == PromotionType.SHIPPING
                                ? "Voucher vận chuyển chỉ giảm phí giao hàng; không áp dụng vào giá hàng hoặc giao dịch POS."
                                : "Khuyến mãi này được áp dụng tự động, không dùng làm mã voucher.");
            } else {
                manual = calculateForVoucher(voucher, amount, quantity, now);
                if (consume && manual.isValid()) consumeUsage(voucher);
            }
            if (consume && !manual.isValid()) {
                throw new IllegalArgumentException("Mã voucher không hợp lệ: " + manual.message());
            }
        }

        BigDecimal manualAmount = manual != null && manual.isValid() ? manual.discountAmount() : BigDecimal.ZERO;
        VoucherValidationResponse automatic = null;
        BigDecimal automaticAmount = BigDecimal.ZERO;
        if (quantity > 0 && manualAmount.compareTo(amount) < 0) {
            List<Voucher> eligible = consume
                    ? voucherRepository.findEligibleAutomaticPromotionsWithLock(PromotionType.AUTOMATIC_ORDER,
                            amount, quantity, now, PageRequest.of(0, 1))
                    : voucherRepository.findEligibleAutomaticPromotions(PromotionType.AUTOMATIC_ORDER,
                            amount, quantity, now, PageRequest.of(0, 1));
            if (!eligible.isEmpty()) {
                Voucher promotion = eligible.getFirst();
                automatic = calculateForVoucher(promotion, amount, quantity, now);
                if (automatic.isValid()) {
                    automaticAmount = automatic.discountAmount().min(amount.subtract(manualAmount));
                }
                if (automaticAmount.signum() > 0) {
                    if (consume) consumeUsage(promotion);
                } else {
                    automatic = null;
                }
            }
        }
        BigDecimal total = manualAmount.add(automaticAmount).min(amount);
        return new DiscountCalculationResponse(manual, automatic, manualAmount, automaticAmount,
                total, amount.subtract(total));
    }

    private void consumeUsage(Voucher voucher) {
        voucher.setUsedCount((voucher.getUsedCount() == null ? 0 : voucher.getUsedCount()) + 1);
        voucherRepository.save(voucher);
    }

    @Override
    @Transactional
    public void releaseUsage(String voucherCode) {
        if (voucherCode == null || voucherCode.isBlank()) return;
        voucherRepository.findByCodeIgnoreCaseWithLock(voucherCode.trim().toUpperCase(Locale.ROOT))
                .ifPresent(voucher -> {
                    int usedCount = voucher.getUsedCount() == null ? 0 : voucher.getUsedCount();
                    if (usedCount > 0) {
                        voucher.setUsedCount(usedCount - 1);
                        voucherRepository.save(voucher);
                    }
                });
    }

    @Override
    public Page<VoucherResponse> searchVouchers(String search, PromotionType type, Boolean isActive, String state, Pageable pageable) {
        if (pageable.getOffset() > Integer.MAX_VALUE) {
            throw new IllegalArgumentException("Trang yêu cầu vượt giới hạn phân trang. Vui lòng chọn trang nhỏ hơn.");
        }
        if (pageable.getSort().stream().anyMatch(order -> !Set.of("id", "createdAt", "updatedAt", "code").contains(order.getProperty()))) {
            throw new IllegalArgumentException("Trường sắp xếp voucher không được hỗ trợ.");
        }
        String normalizedState = state == null || state.isBlank() || "ALL".equalsIgnoreCase(state.trim()) ? null : state.trim().toUpperCase(Locale.ROOT);
        if (normalizedState != null && !Set.of("ACTIVE", "UPCOMING", "EXPIRED", "EXHAUSTED", "INACTIVE").contains(normalizedState)) {
            throw new IllegalArgumentException("Trạng thái voucher không hợp lệ.");
        }
        // A non-null empty search keeps Hibernate/PostgreSQL string binding
        // consistent inside LOWER/CONCAT while matching every voucher code.
        return voucherRepository.search(search == null ? "" : search.trim(), type, isActive,
                normalizedState, Instant.now(), pageable).map(this::mapToVoucherResponse);
    }

    @Override
    public VoucherValidationResponse calculateShippingDiscount(String code, BigDecimal fee, BigDecimal subtotal, int quantity) {
        return shippingDiscount(code, fee, subtotal, quantity, false);
    }

    @Override @Transactional
    public VoucherValidationResponse consumeShippingDiscount(String code, BigDecimal fee, BigDecimal subtotal, int quantity) {
        return shippingDiscount(code, fee, subtotal, quantity, true);
    }

    private VoucherValidationResponse shippingDiscount(String code, BigDecimal fee, BigDecimal subtotal, int quantity, boolean consume) {
        if (code == null || code.isBlank()) return null;
        String normalized = code.trim().toUpperCase(Locale.ROOT);
        if (fee == null || fee.signum() < 0 || subtotal == null || subtotal.signum() < 0 || quantity < 0) {
            throw new IllegalArgumentException("Giá trị phí vận chuyển hoặc đơn hàng không hợp lệ.");
        }
        if (fee.signum() == 0) {
            return new VoucherValidationResponse(normalized, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
                    cartMapper.formatPriceDisplay(BigDecimal.ZERO), fee, cartMapper.formatPriceDisplay(fee), false,
                    "Đơn hàng đã miễn phí vận chuyển; không sử dụng thêm lượt voucher vận chuyển.");
        }
        Voucher voucher = (consume ? voucherRepository.findByCodeIgnoreCaseWithLock(normalized)
                : voucherRepository.findByCodeIgnoreCase(normalized)).orElse(null);
        String invalid = voucher == null ? "Mã voucher vận chuyển không tồn tại."
                : voucher.getPromotionType() != PromotionType.SHIPPING ? "Mã này không phải voucher vận chuyển."
                : getUnavailableReason(voucher, Instant.now());
        if (invalid == null && subtotal.compareTo(voucher.getMinimumOrderValue()) < 0) invalid = "Đơn hàng chưa đạt giá trị tối thiểu của voucher vận chuyển.";
        if (invalid == null && voucher.getMinimumQuantity() != null && quantity < voucher.getMinimumQuantity()) invalid = "Đơn hàng chưa đạt số lượng tối thiểu của voucher vận chuyển.";
        if (invalid == null && (voucher.getFixedDiscountAmount() == null || voucher.getFixedDiscountAmount().signum() <= 0)) invalid = "Voucher vận chuyển chưa có mức giảm hợp lệ. Vui lòng liên hệ nhân viên.";
        if (invalid != null) {
            if (consume) throw new IllegalArgumentException(invalid);
            return new VoucherValidationResponse(normalized, BigDecimal.ZERO, voucher == null ? BigDecimal.ZERO : voucher.getMinimumOrderValue(),
                    BigDecimal.ZERO, cartMapper.formatPriceDisplay(BigDecimal.ZERO), fee, cartMapper.formatPriceDisplay(fee), false, invalid);
        }
        BigDecimal discount = voucher.getFixedDiscountAmount().min(fee);
        if (consume && discount.signum() > 0) consumeUsage(voucher);
        return new VoucherValidationResponse(voucher.getCode(), BigDecimal.ZERO, voucher.getMinimumOrderValue(), discount,
                cartMapper.formatPriceDisplay(discount), fee.subtract(discount), cartMapper.formatPriceDisplay(fee.subtract(discount)), true,
                "Đã áp dụng voucher vận chuyển.");
    }

    @Override
    @Transactional
    public VoucherResponse createVoucher(CreateVoucherRequest request) {
        String code = request.code().trim().toUpperCase(Locale.ROOT);
        if (voucherRepository.existsByCodeIgnoreCase(code)) {
            throw new IllegalArgumentException("Mã voucher đã tồn tại: " + code);
        }

        validateVoucherPeriod(request.validFrom(), request.validUntil());
        PromotionType type = request.promotionType() == null ? PromotionType.MANUAL : request.promotionType();
        validateDiscountConfiguration(type, request.discountRate(), request.fixedDiscountAmount());
        Voucher voucher = Voucher.builder()
                .code(code)
                .discountRate(type == PromotionType.SHIPPING ? BigDecimal.ZERO : request.discountRate())
                .fixedDiscountAmount(request.fixedDiscountAmount())
                .minimumOrderValue(request.minimumOrderValue())
                .description(request.description() != null ? request.description().trim() : null)
                .isActive(request.isActive() == null || request.isActive())
                .validFrom(request.validFrom())
                .validUntil(request.validUntil())
                .usageLimit(request.usageLimit())
                .promotionType(request.promotionType() == null ? PromotionType.MANUAL : request.promotionType())
                .minimumQuantity(request.minimumQuantity())
                .build();

        Voucher saved = voucherRepository.save(voucher);
        return mapToVoucherResponse(saved);
    }

    @Override
    @Transactional
    public VoucherResponse updateVoucher(Long id, UpdateVoucherRequest request) {
        Voucher voucher = voucherRepository.findByIdWithLock(id)
                .orElseThrow(() -> new ResourceNotFoundException("Voucher không tồn tại: " + id));

        validateVoucherPeriod(request.validFrom(), request.validUntil());
        PromotionType type = request.promotionType() == null ? voucher.getPromotionType() : request.promotionType();
        validateDiscountConfiguration(type, request.discountRate(), request.fixedDiscountAmount());
        if (type != voucher.getPromotionType() && hasHistoricalUsage(voucher)) {
            throw new IllegalArgumentException("Không thể đổi loại voucher đã từng được sử dụng. Vui lòng tạo mã mới.");
        }
        int usedCount = voucher.getUsedCount() == null ? 0 : voucher.getUsedCount();
        if (request.usageLimit() != null && request.usageLimit() < usedCount) {
            throw new IllegalArgumentException("Số lượt sử dụng tối đa không thể nhỏ hơn số lượt đã dùng.");
        }

        voucher.setDiscountRate(type == PromotionType.SHIPPING ? BigDecimal.ZERO : request.discountRate());
        voucher.setFixedDiscountAmount(request.fixedDiscountAmount());
        voucher.setMinimumOrderValue(request.minimumOrderValue());
        if (request.description() != null) {
            voucher.setDescription(request.description().trim());
        }
        if (request.isActive() != null) {
            voucher.setActive(request.isActive());
        }
        voucher.setValidFrom(request.validFrom());
        voucher.setValidUntil(request.validUntil());
        voucher.setUsageLimit(request.usageLimit());
        if (request.promotionType() != null) voucher.setPromotionType(request.promotionType());
        voucher.setMinimumQuantity(request.minimumQuantity());

        Voucher updated = voucherRepository.save(voucher);
        return mapToVoucherResponse(updated);
    }

    @Override
    @Transactional
    public void deleteVoucher(Long id) {
        Voucher voucher = voucherRepository.findByIdWithLock(id)
                .orElseThrow(() -> new ResourceNotFoundException("Voucher không tồn tại: " + id));

        boolean inUseInOrders = orderRepository.existsByVoucherCodeIgnoreCase(voucher.getCode())
                || orderRepository.existsByAutomaticPromotionCodeIgnoreCase(voucher.getCode())
                || orderRepository.existsByShippingVoucherCodeIgnoreCase(voucher.getCode());
        boolean inUseInInvoices = invoiceRepository.existsByVoucherCodeIgnoreCase(voucher.getCode())
                || invoiceRepository.existsByAutomaticPromotionCodeIgnoreCase(voucher.getCode());
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
                v.getValidFrom(),
                v.getValidUntil(),
                v.getUsageLimit(),
                v.getUsedCount(),
                v.getCreatedAt(),
                v.getUpdatedAt(),
                v.getPromotionType(),
                v.getMinimumQuantity(),
                v.getFixedDiscountAmount()
        );
    }

    private VoucherValidationResponse calculateForVoucher(Voucher voucher, BigDecimal orderAmount,
                                                           int quantity, Instant now) {
        BigDecimal safeAmount = orderAmount != null && orderAmount.compareTo(BigDecimal.ZERO) >= 0
                ? orderAmount : BigDecimal.ZERO;
        String unavailableReason = getUnavailableReason(voucher, now);
        if (unavailableReason != null) return invalidVoucherResponse(voucher, safeAmount, unavailableReason);
        if (voucher.getMinimumOrderValue() != null && safeAmount.compareTo(voucher.getMinimumOrderValue()) < 0) {
            return invalidVoucherResponse(voucher, safeAmount,
                    "Đơn hàng chưa đạt giá trị tối thiểu (" + cartMapper.formatPriceDisplay(voucher.getMinimumOrderValue()) + ").");
        }
        if (voucher.getMinimumQuantity() != null && quantity < voucher.getMinimumQuantity()) {
            return invalidVoucherResponse(voucher, safeAmount,
                    "Đơn hàng chưa đạt số lượng tối thiểu (" + voucher.getMinimumQuantity() + ").");
        }
        BigDecimal discount = safeAmount.multiply(voucher.getDiscountRate()).setScale(0, RoundingMode.HALF_UP)
                .min(safeAmount);
        BigDecimal finalAmount = safeAmount.subtract(discount).max(BigDecimal.ZERO);
        return new VoucherValidationResponse(voucher.getCode(), voucher.getDiscountRate(),
                voucher.getMinimumOrderValue(), discount, cartMapper.formatPriceDisplay(discount),
                finalAmount, cartMapper.formatPriceDisplay(finalAmount), true,
                "Áp dụng mã giảm giá thành công: " + (voucher.getDescription() != null ? voucher.getDescription() : ""));
    }

    private VoucherValidationResponse invalidVoucherResponse(Voucher voucher, BigDecimal amount, String message) {
        return new VoucherValidationResponse(voucher.getCode(), voucher.getDiscountRate(),
                voucher.getMinimumOrderValue(), BigDecimal.ZERO, cartMapper.formatPriceDisplay(BigDecimal.ZERO),
                amount, cartMapper.formatPriceDisplay(amount), false, message);
    }

    private String getUnavailableReason(Voucher voucher, Instant now) {
        if (!voucher.isActive()) return "Mã voucher hiện không thể sử dụng.";
        if (voucher.getValidFrom() != null && now.isBefore(voucher.getValidFrom())) return "Mã voucher chưa đến thời gian sử dụng.";
        if (voucher.getValidUntil() != null && now.isAfter(voucher.getValidUntil())) return "Mã voucher đã hết hạn.";
        int usedCount = voucher.getUsedCount() == null ? 0 : voucher.getUsedCount();
        if (usedCount == Integer.MAX_VALUE) return "Mã voucher đã hết lượt sử dụng.";
        if (voucher.getUsageLimit() != null && usedCount >= voucher.getUsageLimit()) return "Mã voucher đã hết lượt sử dụng.";
        return null;
    }

    private void validateVoucherPeriod(Instant validFrom, Instant validUntil) {
        if (validFrom != null && validUntil != null && !validUntil.isAfter(validFrom)) {
            throw new IllegalArgumentException("Thời gian kết thúc phải sau thời gian bắt đầu.");
        }
    }

    private boolean hasHistoricalUsage(Voucher voucher) {
        return (voucher.getUsedCount() != null && voucher.getUsedCount() > 0)
                || orderRepository.existsByVoucherCodeIgnoreCase(voucher.getCode())
                || orderRepository.existsByAutomaticPromotionCodeIgnoreCase(voucher.getCode())
                || orderRepository.existsByShippingVoucherCodeIgnoreCase(voucher.getCode())
                || invoiceRepository.existsByVoucherCodeIgnoreCase(voucher.getCode())
                || invoiceRepository.existsByAutomaticPromotionCodeIgnoreCase(voucher.getCode());
    }

    private void validateDiscountConfiguration(PromotionType type, BigDecimal rate, BigDecimal fixed) {
        if (type == PromotionType.SHIPPING) {
            if (rate != null || fixed == null || fixed.signum() <= 0 || fixed.scale() > 0 || fixed.precision() > 13) {
                throw new IllegalArgumentException("Voucher vận chuyển cần mức giảm cố định là số nguyên dương tối đa 13 chữ số và không có tỷ lệ giảm giá.");
            }
        } else if (fixed != null || rate == null || rate.signum() < 0 || rate.compareTo(BigDecimal.ONE) > 0 || rate.scale() > 4) {
            throw new IllegalArgumentException("Voucher giảm giá cần tỷ lệ từ 0 đến 1 với tối đa 4 chữ số thập phân và không có mức giảm phí vận chuyển.");
        }
    }
}
