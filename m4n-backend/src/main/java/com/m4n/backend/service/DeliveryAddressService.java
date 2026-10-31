package com.m4n.backend.service;

import com.m4n.backend.dto.request.SaveDeliveryAddressRequest;
import com.m4n.backend.dto.response.DeliveryAddressPageResponse;
import com.m4n.backend.dto.response.SavedDeliveryAddressResponse;

public interface DeliveryAddressService {
    DeliveryAddressPageResponse list(int page);
    SavedDeliveryAddressResponse create(SaveDeliveryAddressRequest request);
    SavedDeliveryAddressResponse update(Long id, SaveDeliveryAddressRequest request);
    void delete(Long id, Long expectedVersion);
}
