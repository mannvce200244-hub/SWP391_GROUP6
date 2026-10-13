package com.m4n.backend.service;

import com.m4n.backend.dto.response.CategorySummaryResponse;

import java.util.List;

public interface CategoryService {
    List<CategorySummaryResponse> listCategories();
}
