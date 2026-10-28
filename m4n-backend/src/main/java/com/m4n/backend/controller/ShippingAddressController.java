package com.m4n.backend.controller;
import com.m4n.backend.dto.response.*;
import com.m4n.backend.service.GhnService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/shipping")
@RequiredArgsConstructor
public class ShippingAddressController {
    private final GhnService carrier;
    @GetMapping("/options") public ShippingOptionsResponse options() { return carrier.getOptions(); }
    @GetMapping("/provinces") public List<AddressOptionResponse> provinces() { return carrier.provinces(); }
    @GetMapping("/provinces/{provinceId}/wards") public List<AddressOptionResponse> wards(@PathVariable int provinceId) {
        return carrier.wards(provinceId);
    }
}
