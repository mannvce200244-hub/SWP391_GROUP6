package com.m4n.backend.serviceImpl;

import com.m4n.backend.dto.response.CategorySummaryResponse;
import com.m4n.backend.repository.CategoryRepository;
import com.m4n.backend.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;

    @Override
    @Transactional(readOnly = true)
    public List<CategorySummaryResponse> listCategories() {
        return categoryRepository.findAll().stream()
                .map(cat -> new CategorySummaryResponse(cat.getId(), cat.getCode(), cat.getName()))
                .toList();
    }
}
