package com.m4n.backend.service;
import com.m4n.backend.dto.request.DeliveryAddressRequest;
import com.m4n.backend.dto.response.*;
import java.util.List;

public interface GhnService {
    ShippingOptionsResponse getOptions();
    List<AddressOptionResponse> provinces();
    List<AddressOptionResponse> wards(int provinceId);
    CarrierShippingQuote quote(List<ShippingLine> lines, DeliveryAddressRequest address, String name, String phone);
}
