package com.m4n.backend.dto.response;

import com.m4n.backend.dto.request.DeliveryAddressRequest;

public record SavedDeliveryAddressResponse(Long id, String customerName, String customerPhone,
        String customerEmail, String shippingAddress, String notes, DeliveryAddressRequest deliveryAddress,
        Long version) {}
