package com.m4n.backend.service;

import com.m4n.backend.dto.response.CategorySummaryResponse;
import com.m4n.backend.entity.Category;
import com.m4n.backend.repository.CategoryRepository;
import com.m4n.backend.serviceImpl.CategoryServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CategoryServiceTest {

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private com.m4n.backend.repository.ProductRepository productRepository;

    @InjectMocks
    private CategoryServiceImpl categoryService;

    @Test
    @DisplayName("Should list all categories minimal response")
    void shouldListAllCategories() {
        Category c1 = Category.builder().id(1L).code("DAY").name("Nhạc cụ dây").build();
        Category c2 = Category.builder().id(2L).code("HOI").name("Nhạc cụ hơi").build();

        when(categoryRepository.findAll()).thenReturn(List.of(c1, c2));

        List<CategorySummaryResponse> result = categoryService.listCategories();

        assertThat(result).hasSize(2);
        assertThat(result.get(0).code()).isEqualTo("DAY");
        assertThat(result.get(0).name()).isEqualTo("Nhạc cụ dây");
        assertThat(result.get(1).code()).isEqualTo("HOI");
    }

    @Test
    @DisplayName("Should reject duplicate category code on create")
    void shouldRejectDuplicateCategoryCode() {
        when(categoryRepository.existsByCodeIgnoreCase("DAY")).thenReturn(true);

        com.m4n.backend.dto.request.CreateCategoryRequest request = new com.m4n.backend.dto.request.CreateCategoryRequest(
                "DAY", "Nhạc cụ dây mới", null
        );

        assertThatThrownBy(() -> categoryService.createCategory(request))
                .isInstanceOf(com.m4n.backend.exception.DuplicateResourceException.class)
                .hasMessageContaining("DAY");
    }

    @Test
    @DisplayName("Should reject delete category when products are associated")
    void shouldRejectDeleteCategoryWhenInUse() {
        Category cat = Category.builder().id(1L).code("DAY").name("Nhạc cụ dây").build();
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(cat));
        when(productRepository.countByCategoryId(1L)).thenReturn(5L);

        assertThatThrownBy(() -> categoryService.deleteCategory(1L))
                .isInstanceOf(com.m4n.backend.exception.ResourceInUseException.class)
                .hasMessageContaining("5");
    }

    @Test
    @DisplayName("Should list admin categories with mapped product counts")
    void shouldListAdminCategoriesWithProductCounts() {
        Category c1 = Category.builder().id(1L).code("DAY").name("Nhạc cụ dây").build();
        Category c2 = Category.builder().id(2L).code("HOI").name("Nhạc cụ hơi").build();

        when(categoryRepository.findAll(org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.ASC, "name")))
                .thenReturn(List.of(c1, c2));
        List<Object[]> counts = new java.util.ArrayList<>();
        counts.add(new Object[]{1L, 7L});
        counts.add(new Object[]{2L, 3L});
        when(productRepository.countProductsGroupedByCategoryId())
                .thenReturn(counts);

        List<com.m4n.backend.dto.response.CategoryDetailResponse> result = categoryService.listAdminCategories(null);

        assertThat(result).hasSize(2);
        assertThat(result.get(0).productCount()).isEqualTo(7L);
        assertThat(result.get(1).productCount()).isEqualTo(3L);
    }

    @Test
    @DisplayName("Should filter admin categories when search term is provided")
    void shouldFilterAdminCategoriesWithSearch() {
        Category c1 = Category.builder().id(1L).code("DAY").name("Nhạc cụ dây").build();

        when(categoryRepository.searchCategories("dây"))
                .thenReturn(List.of(c1));
        List<Object[]> counts = new java.util.ArrayList<>();
        counts.add(new Object[]{1L, 5L});
        when(productRepository.countProductsGroupedByCategoryId())
                .thenReturn(counts);

        List<com.m4n.backend.dto.response.CategoryDetailResponse> result = categoryService.listAdminCategories("dây");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).code()).isEqualTo("DAY");
        assertThat(result.get(0).productCount()).isEqualTo(5L);
    }
}
