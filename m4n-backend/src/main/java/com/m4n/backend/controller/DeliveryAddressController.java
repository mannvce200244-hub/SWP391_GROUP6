package com.m4n.backend.controller;

import com.m4n.backend.dto.request.SaveDeliveryAddressRequest;
import com.m4n.backend.dto.response.*;
import com.m4n.backend.service.DeliveryAddressService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/profile/delivery-addresses")
@PreAuthorize("hasRole('CUSTOMER')")
@RequiredArgsConstructor
public class DeliveryAddressController {
    private final DeliveryAddressService addresses;

    @GetMapping
    public DeliveryAddressPageResponse list(@RequestParam(defaultValue = "0") @PositiveOrZero int page) {
        return addresses.list(page);
    }

    @PostMapping @ResponseStatus(HttpStatus.CREATED)
    public SavedDeliveryAddressResponse create(@Valid @RequestBody SaveDeliveryAddressRequest request) {
        return addresses.create(request);
    }

    @PutMapping("/{id}")
    public SavedDeliveryAddressResponse update(@PathVariable @Positive Long id,
            @Valid @RequestBody SaveDeliveryAddressRequest request) {
        return addresses.update(id, request);
    }

    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable @Positive Long id, @RequestParam @PositiveOrZero Long expectedVersion) {
        addresses.delete(id, expectedVersion);
    }
}
