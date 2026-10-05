package com.m4n.backend.service;

import com.m4n.backend.dto.response.ProductDetailResponse;
import com.m4n.backend.dto.response.ProductSummaryResponse;

import java.math.BigDecimal;
import java.util.List;

public interface ProductService {

    ProductDetailResponse getProductDetail(Long productId);

    List<ProductSummaryResponse> listProducts(
            String keyword,
            String group,
            String artisan,
            String craftVillage,
            BigDecimal minPrice,
            BigDecimal maxPrice
    );
}
