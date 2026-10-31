package com.m4n.backend.controller;

import com.m4n.backend.dto.request.CreateCategoryRequest;
import com.m4n.backend.dto.request.UpdateCategoryRequest;
import com.m4n.backend.dto.response.CategoryDetailResponse;
import com.m4n.backend.service.CategoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/categories")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Admin Category Management", description = "Back-office category management APIs")
public class AdminCategoryController {

    private final CategoryService categoryService;

    @GetMapping
    @Operation(summary = "List all categories with product counts", description = "Returns all categories for back-office management with optional search query.")
    public ResponseEntity<List<CategoryDetailResponse>> listAdminCategories(
            @org.springframework.web.bind.annotation.RequestParam(required = false) String search
    ) {
        return ResponseEntity.ok(categoryService.listAdminCategories(search));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get category detail by ID", description = "Returns full category detail.")
    public ResponseEntity<CategoryDetailResponse> getCategoryDetail(@PathVariable Long id) {
        return ResponseEntity.ok(categoryService.getAdminCategoryDetail(id));
    }

    @PostMapping
    @Operation(summary = "Create category", description = "Creates a new category.")
    public ResponseEntity<CategoryDetailResponse> createCategory(@Valid @RequestBody CreateCategoryRequest request) {
        CategoryDetailResponse created = categoryService.createCategory(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update category", description = "Updates an existing category.")
    public ResponseEntity<CategoryDetailResponse> updateCategory(
            @PathVariable Long id,
            @Valid @RequestBody UpdateCategoryRequest request
    ) {
        return ResponseEntity.ok(categoryService.updateCategory(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete category", description = "Deletes a category if not in use by any products.")
    public ResponseEntity<Void> deleteCategory(@PathVariable Long id) {
        categoryService.deleteCategory(id);
        return ResponseEntity.noContent().build();
    }
}
