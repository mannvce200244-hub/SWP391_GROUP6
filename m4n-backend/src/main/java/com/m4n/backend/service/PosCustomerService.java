package com.m4n.backend.service;

import com.m4n.backend.dto.request.PosSaleRequest;
import com.m4n.backend.dto.response.PosCustomerSearchResponse;
import com.m4n.backend.entity.Invoice;

public interface PosCustomerService {
    PosCustomerSearchResponse searchCustomers(String query);
    void validateCustomer(PosSaleRequest request);
    void attachCustomer(Invoice invoice, PosSaleRequest request);
}
