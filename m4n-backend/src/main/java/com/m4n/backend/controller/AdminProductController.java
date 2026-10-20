package com.m4n.backend.controller;

import com.m4n.backend.dto.request.CreateProductMediaRequest;
import com.m4n.backend.dto.request.CreateProductRequest;
import com.m4n.backend.dto.request.ProductStatusUpdateRequest;
import com.m4n.backend.dto.request.UpdateProductMediaRequest;
import com.m4n.backend.dto.request.UpdateProductRequest;
import com.m4n.backend.dto.response.AdminProductDetailResponse;
import com.m4n.backend.dto.response.AdminProductSummaryResponse;
import com.m4n.backend.dto.response.ProductMediaResponse;
import com.m4n.backend.service.ProductService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/products")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Admin Product Management", description = "Back-office product master management APIs")
public class AdminProductController {

    private final ProductService productService;

    @GetMapping
    @Operation(summary = "Browse and filter admin products", description = "Returns paginated list of all products with stock and status.")
    public ResponseEntity<Page<AdminProductSummaryResponse>> listAdminProducts(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Long artisanId,
            @RequestParam(required = false) Long craftVillageId,
            @RequestParam(required = false) Boolean isActive,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(productService.listAdminProducts(keyword, categoryId, artisanId, craftVillageId, isActive, pageable));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get admin product detail by ID", description = "Returns full product specification, inventory, and media gallery.")
    public ResponseEntity<AdminProductDetailResponse> getAdminProductDetail(@PathVariable Long id) {
        return ResponseEntity.ok(productService.getAdminProductDetail(id));
    }

    @PostMapping
    @Operation(summary = "Create a new product", description = "Creates a product with initial inventory quantity of 0.")
    public ResponseEntity<AdminProductDetailResponse> createProduct(@Valid @RequestBody CreateProductRequest request) {
        AdminProductDetailResponse created = productService.createProduct(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update product details", description = "Updates product fields without altering inventory balance.")
    public ResponseEntity<AdminProductDetailResponse> updateProduct(
            @PathVariable Long id,
            @Valid @RequestBody UpdateProductRequest request
    ) {
        return ResponseEntity.ok(productService.updateProduct(id, request));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Update product active status", description = "Activates or deactivates a product.")
    public ResponseEntity<AdminProductDetailResponse> updateProductStatus(
            @PathVariable Long id,
            @Valid @RequestBody ProductStatusUpdateRequest request
    ) {
        return ResponseEntity.ok(productService.updateProductStatus(id, request.isActive()));
    }

    @PostMapping("/{id}/media")
    @Operation(summary = "Add media to product gallery", description = "Adds an image or video to the product.")
    public ResponseEntity<ProductMediaResponse> addProductMedia(
            @PathVariable Long id,
            @Valid @RequestBody CreateProductMediaRequest request
    ) {
        ProductMediaResponse media = productService.addProductMedia(id, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(media);
    }

    @PutMapping("/{id}/media/{mediaId}")
    @Operation(summary = "Update product media item", description = "Updates media metadata or display order. The lowest display order is the primary media item.")
    public ResponseEntity<ProductMediaResponse> updateProductMedia(
            @PathVariable Long id,
            @PathVariable Long mediaId,
            @Valid @RequestBody UpdateProductMediaRequest request
    ) {
        return ResponseEntity.ok(productService.updateProductMedia(id, mediaId, request));
    }

    @DeleteMapping("/{id}/media/{mediaId}")
    @Operation(summary = "Delete product media item", description = "Removes a media item from the product gallery.")
    public ResponseEntity<Void> deleteProductMedia(
            @PathVariable Long id,
            @PathVariable Long mediaId
    ) {
        productService.deleteProductMedia(id, mediaId);
        return ResponseEntity.noContent().build();
    }
}
