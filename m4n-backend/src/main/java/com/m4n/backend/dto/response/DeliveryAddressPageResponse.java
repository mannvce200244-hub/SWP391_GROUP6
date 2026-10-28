package com.m4n.backend.dto.response;

import java.util.List;

public record DeliveryAddressPageResponse(List<SavedDeliveryAddressResponse> items, int page,
        int totalPages, long totalElements) {}
