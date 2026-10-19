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

    com.m4n.backend.dto.response.AdminProductDetailResponse getAdminProductDetail(Long productId);

    Page<com.m4n.backend.dto.response.AdminProductSummaryResponse> listAdminProducts(
            String keyword,
            Long categoryId,
            Long artisanId,
            Long craftVillageId,
            Boolean isActive,
            Pageable pageable
    );

    com.m4n.backend.dto.response.AdminProductDetailResponse createProduct(
            com.m4n.backend.dto.request.CreateProductRequest request
    );

    com.m4n.backend.dto.response.AdminProductDetailResponse updateProduct(
            Long productId,
            com.m4n.backend.dto.request.UpdateProductRequest request
    );

    com.m4n.backend.dto.response.AdminProductDetailResponse updateProductStatus(
            Long productId,
            boolean isActive
    );

    com.m4n.backend.dto.response.ProductMediaResponse addProductMedia(
            Long productId,
            com.m4n.backend.dto.request.CreateProductMediaRequest request
    );

    com.m4n.backend.dto.response.ProductMediaResponse updateProductMedia(
            Long productId,
            Long mediaId,
            com.m4n.backend.dto.request.UpdateProductMediaRequest request
    );

    void deleteProductMedia(Long productId, Long mediaId);
}
