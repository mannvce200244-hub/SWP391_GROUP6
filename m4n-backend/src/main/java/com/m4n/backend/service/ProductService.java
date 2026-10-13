package com.m4n.backend.service;

import com.m4n.backend.dto.response.ProductDetailResponse;
import com.m4n.backend.dto.response.ProductSummaryResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.List;

public interface ProductService {

    ProductDetailResponse getProductDetail(Long productId);

    Page<ProductSummaryResponse> listProducts(
            String keyword,
            String group,
            String artisan,
            String craftVillage,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            Pageable pageable
    );

    List<ProductSummaryResponse> listProducts(
            String keyword,
            String group,
            String artisan,
            String craftVillage,
            BigDecimal minPrice,
            BigDecimal maxPrice
    );
}
