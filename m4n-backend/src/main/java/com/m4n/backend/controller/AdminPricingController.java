package com.m4n.backend.controller;

import com.m4n.backend.dto.request.*;
import com.m4n.backend.dto.response.*;
import com.m4n.backend.service.ProductPromotionService;
import com.m4n.backend.service.ShippingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/v1/admin") @RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
public class AdminPricingController {
    private final ProductPromotionService promotionService;
    private final ShippingService shippingService;

    @GetMapping("/product-promotions")
    public Page<ProductPromotionResponse> listPromotions(@RequestParam(required = false) Long productId,
            @RequestParam(required = false) Boolean isActive, @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        return promotionService.listPromotions(productId, isActive, page, size);
    }
    @PostMapping("/product-promotions")
    public ResponseEntity<ProductPromotionResponse> createPromotion(@Valid @RequestBody CreateProductPromotionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(promotionService.createPromotion(request));
    }
    @PutMapping("/product-promotions/{id}")
    public ProductPromotionResponse updatePromotion(@PathVariable Long id, @Valid @RequestBody UpdateProductPromotionRequest request) {
        return promotionService.updatePromotion(id, request);
    }
    @DeleteMapping("/product-promotions/{id}")
    public ResponseEntity<Void> deletePromotion(@PathVariable Long id, @RequestParam Long expectedVersion) {
        promotionService.deletePromotion(id, expectedVersion); return ResponseEntity.noContent().build();
    }
    @GetMapping("/shipping-settings")
    public ShippingSettingsResponse getSettings() { return shippingService.getSettings(); }
    @PutMapping("/shipping-settings")
    public ShippingSettingsResponse updateSettings(@Valid @RequestBody UpdateShippingSettingsRequest request) { return shippingService.updateSettings(request); }
}
