package com.m4n.backend.service.serviceImpl;

import com.m4n.backend.dto.request.UpdateShippingSettingsRequest;
import com.m4n.backend.dto.response.ShippingSettingsResponse;
import com.m4n.backend.entity.ShippingSettings;
import com.m4n.backend.repository.ShippingSettingsRepository;
import com.m4n.backend.service.*;
import com.m4n.backend.validation.MoneyValidation;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Objects;

@Service @RequiredArgsConstructor
public class ShippingServiceImpl implements ShippingService {
    private final ShippingSettingsRepository settingsRepository;

    @Override @Transactional
    public ShippingSettingsResponse getSettings() { return toResponse(settings()); }

    @Override @Transactional
    public ShippingSettingsResponse updateSettings(UpdateShippingSettingsRequest request) {
        ShippingSettings settings = settings();
        if (!Objects.equals(settings.getVersion(), request.expectedVersion())) throw new IllegalStateException("Cấu hình vận chuyển đã thay đổi. Vui lòng tải lại và kiểm tra trước khi lưu.");
        if (Boolean.TRUE.equals(request.freeShippingEnabled()) && request.freeShippingThreshold() == null) {
            throw new IllegalArgumentException("Vui lòng nhập ngưỡng đơn hàng khi bật miễn phí vận chuyển.");
        }
        settings.setEnabled(request.enabled()); settings.setRatePerKg(request.ratePerKg());
        settings.setFreeShippingEnabled(request.freeShippingEnabled()); settings.setFreeShippingThreshold(request.freeShippingThreshold());
        return toResponse(settingsRepository.saveAndFlush(settings));
    }

    @Override @Transactional(readOnly = true)
    public ShippingQuote calculateShipping(List<ShippingLine> lines, BigDecimal subtotal) {
        ShippingSettings settings = settingsRepository.findById(1L).orElse(null);
        if (settings == null || !settings.isEnabled()) {
            return new ShippingQuote(BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, false);
        }
        BigDecimal base = BigDecimal.ZERO;
        for (ShippingLine line : lines) {
            if (line.product() == null || line.quantity() <= 0) throw new IllegalArgumentException("Sản phẩm hoặc số lượng tính phí vận chuyển không hợp lệ.");
            var product = line.product();
            if (product.getBillableWeightKg() == null || product.getBillableWeightKg().signum() <= 0) {
                throw new IllegalArgumentException("Sản phẩm '" + product.getName() + "' chưa có trọng lượng tính cước hợp lệ. Vui lòng liên hệ nhân viên để cập nhật trước khi đặt hàng.");
            }
            BigDecimal surcharge = product.getBulkySurcharge() != null ? product.getBulkySurcharge() : BigDecimal.ZERO;
            base = base.add(product.getBillableWeightKg().multiply(settings.getRatePerKg()).add(surcharge).multiply(BigDecimal.valueOf(line.quantity())));
        }
        base = base.setScale(0, RoundingMode.HALF_UP);
        MoneyValidation.requireSupported(base);
        boolean free = settings.isFreeShippingEnabled() && settings.getFreeShippingThreshold() != null
                && subtotal.compareTo(settings.getFreeShippingThreshold()) >= 0;
        return new ShippingQuote(base, free ? base : BigDecimal.ZERO, free ? BigDecimal.ZERO : base, free);
    }

    private ShippingSettings settings() {
        return settingsRepository.findById(1L).orElseGet(() -> {
            settingsRepository.ensureDefaultSettings();
            return settingsRepository.findById(1L).orElseThrow(() -> new IllegalStateException("Không thể khởi tạo cấu hình vận chuyển. Vui lòng thử lại."));
        });
    }

    private ShippingSettingsResponse toResponse(ShippingSettings settings) {
        return new ShippingSettingsResponse(settings.isEnabled(), settings.getRatePerKg(), settings.isFreeShippingEnabled(),
                settings.getFreeShippingThreshold(), settings.getVersion(), settings.getUpdatedAt());
    }
}
