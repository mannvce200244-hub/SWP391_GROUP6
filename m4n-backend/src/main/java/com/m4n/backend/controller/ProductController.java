package com.m4n.backend.controller;

import com.m4n.backend.dto.response.ProductDetailResponse;
import com.m4n.backend.dto.response.ProductSummaryResponse;
import com.m4n.backend.service.ProductService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/products")
@Tag(name = "Product Catalog", description = "Public customer catalog and product detail APIs")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get product detail by ID", description = "Returns full specifications, media gallery, artisan, and craft village for a product.")
    public ResponseEntity<ProductDetailResponse> getProductDetail(@PathVariable Long id) {
        return ResponseEntity.ok(productService.getProductDetail(id));
    }

    @GetMapping
    @Operation(summary = "Browse and filter product catalog", description = "Returns list of active musical instruments matching optional search and filter criteria.")
    public ResponseEntity<List<ProductSummaryResponse>> listProducts(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String group,
            @RequestParam(required = false) String artisan,
            @RequestParam(required = false) String craftVillage,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice
    ) {
        return ResponseEntity.ok(productService.listProducts(keyword, group, artisan, craftVillage, minPrice, maxPrice));
    }
}
