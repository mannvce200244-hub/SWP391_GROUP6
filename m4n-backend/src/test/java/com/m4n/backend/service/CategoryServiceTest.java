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

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CategoryServiceTest {

    @Mock
    private CategoryRepository categoryRepository;

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
}
