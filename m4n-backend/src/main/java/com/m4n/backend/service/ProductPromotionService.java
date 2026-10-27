package com.m4n.backend.service;

import com.m4n.backend.dto.request.CreateProductPromotionRequest;
import com.m4n.backend.dto.request.UpdateProductPromotionRequest;
import com.m4n.backend.dto.response.ProductPromotionResponse;
import org.springframework.data.domain.Page;

public interface ProductPromotionService {
    Page<ProductPromotionResponse> listPromotions(Long productId, Boolean isActive, int page, int size);
    ProductPromotionResponse createPromotion(CreateProductPromotionRequest request);
    ProductPromotionResponse updatePromotion(Long id, UpdateProductPromotionRequest request);
    void deletePromotion(Long id, Long expectedVersion);
}
