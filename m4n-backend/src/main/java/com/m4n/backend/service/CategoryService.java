package com.m4n.backend.service;

import com.m4n.backend.dto.request.CreateCategoryRequest;
import com.m4n.backend.dto.request.UpdateCategoryRequest;
import com.m4n.backend.dto.response.CategoryDetailResponse;
import com.m4n.backend.dto.response.CategorySummaryResponse;

import java.util.List;

public interface CategoryService {
    List<CategorySummaryResponse> listCategories();

    List<CategoryDetailResponse> listAdminCategories();

    List<CategoryDetailResponse> listAdminCategories(String search);

    CategoryDetailResponse getAdminCategoryDetail(Long id);

    CategoryDetailResponse createCategory(CreateCategoryRequest request);

    CategoryDetailResponse updateCategory(Long id, UpdateCategoryRequest request);

    void deleteCategory(Long id);
}

