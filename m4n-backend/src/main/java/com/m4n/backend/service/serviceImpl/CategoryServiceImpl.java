package com.m4n.backend.service.serviceImpl;

import com.m4n.backend.dto.request.CreateCategoryRequest;
import com.m4n.backend.dto.request.UpdateCategoryRequest;
import com.m4n.backend.dto.response.CategoryDetailResponse;
import com.m4n.backend.dto.response.CategorySummaryResponse;
import com.m4n.backend.entity.Category;
import com.m4n.backend.exception.DuplicateResourceException;
import com.m4n.backend.exception.ResourceInUseException;
import com.m4n.backend.exception.ResourceNotFoundException;
import com.m4n.backend.repository.CategoryRepository;
import com.m4n.backend.repository.ProductRepository;
import com.m4n.backend.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    @Override
    @Transactional(readOnly = true)
    public List<CategorySummaryResponse> listCategories() {
        return categoryRepository.findAll().stream()
                .map(cat -> new CategorySummaryResponse(cat.getId(), cat.getCode(), cat.getName()))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<CategoryDetailResponse> listAdminCategories() {
        return listAdminCategories(null);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CategoryDetailResponse> listAdminCategories(String search) {
        List<Category> categories;
        if (search != null && !search.trim().isEmpty()) {
            categories = categoryRepository.searchCategories(search.trim());
        } else {
            categories = categoryRepository.findAll(Sort.by(Sort.Direction.ASC, "name"));
        }

        java.util.Map<Long, Long> productCountMap = productRepository.countProductsGroupedByCategoryId().stream()
                .filter(row -> row != null && row.length >= 2 && row[0] != null)
                .collect(java.util.stream.Collectors.toMap(
                        row -> (Long) row[0],
                        row -> row[1] instanceof Number ? ((Number) row[1]).longValue() : 0L,
                        (existing, replacement) -> existing
                ));

        return categories.stream()
                .map(cat -> new CategoryDetailResponse(
                        cat.getId(),
                        cat.getCode(),
                        cat.getName(),
                        cat.getDescription(),
                        productCountMap.getOrDefault(cat.getId(), 0L),
                        cat.getCreatedAt()
                ))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public CategoryDetailResponse getAdminCategoryDetail(Long id) {
        Category cat = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục với id: " + id));
        long productCount = productRepository.countByCategoryId(cat.getId());
        return new CategoryDetailResponse(
                cat.getId(),
                cat.getCode(),
                cat.getName(),
                cat.getDescription(),
                productCount,
                cat.getCreatedAt()
        );
    }

    @Override
    @Transactional
    public CategoryDetailResponse createCategory(CreateCategoryRequest request) {
        String cleanCode = request.code().trim().toUpperCase();
        String cleanName = request.name().trim();

        if (categoryRepository.existsByCodeIgnoreCase(cleanCode)) {
            throw new DuplicateResourceException("Mã danh mục đã tồn tại: " + cleanCode);
        }
        if (categoryRepository.existsByNameIgnoreCase(cleanName)) {
            throw new DuplicateResourceException("Tên danh mục đã tồn tại: " + cleanName);
        }

        Category category = Category.builder()
                .code(cleanCode)
                .name(cleanName)
                .description(request.description() != null ? request.description().trim() : null)
                .build();

        Category saved = categoryRepository.save(category);
        return new CategoryDetailResponse(
                saved.getId(),
                saved.getCode(),
                saved.getName(),
                saved.getDescription(),
                0,
                saved.getCreatedAt()
        );
    }

    @Override
    @Transactional
    public CategoryDetailResponse updateCategory(Long id, UpdateCategoryRequest request) {
        Category cat = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục với id: " + id));

        String cleanName = request.name().trim();
        if (categoryRepository.existsByNameIgnoreCaseAndIdNot(cleanName, id)) {
            throw new DuplicateResourceException("Tên danh mục đã tồn tại: " + cleanName);
        }

        cat.setName(cleanName);
        cat.setDescription(request.description() != null ? request.description().trim() : null);

        Category updated = categoryRepository.save(cat);
        long productCount = productRepository.countByCategoryId(updated.getId());
        return new CategoryDetailResponse(
                updated.getId(),
                updated.getCode(),
                updated.getName(),
                updated.getDescription(),
                productCount,
                updated.getCreatedAt()
        );
    }

    @Override
    @Transactional
    public void deleteCategory(Long id) {
        Category cat = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục với id: " + id));

        long productCount = productRepository.countByCategoryId(id);
        if (productCount > 0) {
            throw new ResourceInUseException("Không thể xóa danh mục '" + cat.getName() + "' vì đang có " + productCount + " sản phẩm liên kết");
        }

        categoryRepository.delete(cat);
    }
}

