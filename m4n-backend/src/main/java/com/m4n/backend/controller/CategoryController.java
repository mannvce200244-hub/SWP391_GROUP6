package com.m4n.backend.controller;

import com.m4n.backend.dto.response.CategorySummaryResponse;
import com.m4n.backend.service.CategoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/categories")
@RequiredArgsConstructor
@Tag(name = "Category", description = "Public musical instrument category APIs")
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    @Operation(summary = "List all categories", description = "Returns minimal list of instrument categories for browsing and catalog filters.")
    public ResponseEntity<List<CategorySummaryResponse>> listCategories() {
        return ResponseEntity.ok(categoryService.listCategories());
    }
}
