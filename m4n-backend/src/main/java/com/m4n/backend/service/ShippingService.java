package com.m4n.backend.service;

import com.m4n.backend.dto.request.UpdateShippingSettingsRequest;
import com.m4n.backend.dto.response.ShippingSettingsResponse;
import java.math.BigDecimal;
import java.util.List;

public interface ShippingService {
    ShippingSettingsResponse getSettings();
    ShippingSettingsResponse updateSettings(UpdateShippingSettingsRequest request);
    ShippingQuote calculateShipping(List<ShippingLine> lines, BigDecimal subtotal);
    boolean requiresAddress();
    ShippingQuote calculateCarrierShipping(List<ShippingLine> lines, BigDecimal subtotal,
            com.m4n.backend.dto.request.DeliveryAddressRequest address, String name, String phone);
}
