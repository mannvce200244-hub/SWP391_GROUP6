package com.m4n.backend.service;

import com.m4n.backend.dto.request.CreateProductMediaRequest;
import com.m4n.backend.dto.request.CreateProductRequest;
import com.m4n.backend.dto.request.ProductMediaItemRequest;
import com.m4n.backend.dto.request.UpdateProductRequest;
import com.m4n.backend.dto.response.AdminProductDetailResponse;
import com.m4n.backend.entity.Category;
import com.m4n.backend.entity.MediaType;
import com.m4n.backend.exception.ResourceNotFoundException;
import com.m4n.backend.repository.CategoryRepository;
import jakarta.validation.Validator;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
class ProductGalleryIntegrationTest {

    @Autowired private ProductService productService;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private JdbcTemplate jdbcTemplate;
    @Autowired private Validator validator;

    private Category category;
    private final List<Long> createdProductIds = new ArrayList<>();

    @BeforeEach
    void createIsolatedCategory() {
        category = categoryRepository.saveAndFlush(Category.builder()
                .code("GALLERY-" + UUID.randomUUID()).name("Gallery regression category").build());
    }

    @AfterEach
    void removeOnlyTestFixtures() {
        for (Long productId : createdProductIds) {
            jdbcTemplate.update("DELETE FROM product_media WHERE product_id = ?", productId);
            jdbcTemplate.update("DELETE FROM inventories WHERE product_id = ?", productId);
            jdbcTemplate.update("DELETE FROM products WHERE id = ?", productId);
        }
        if (category != null) categoryRepository.deleteById(category.getId());
    }

    @Test
    void productAndGallerySaveTogetherWithPersistentIdsAndCorrectOrder() {
        var initial = createProduct("Original product");
        Long keptId = initial.media().getFirst().id();
        var updated = productService.updateProduct(initial.id(), update("Updated product", List.of(
                new ProductMediaItemRequest(null, MediaType.VIDEO, "/new.mp4", "New video", 0),
                new ProductMediaItemRequest(keptId, MediaType.IMAGE, "/updated.jpg", "Updated image", 1))));

        assertThat(updated.name()).isEqualTo("Updated product");
        assertThat(updated.media()).hasSize(2);
        assertThat(updated.media().getFirst().id()).isNotNull();
        var persisted = productService.getAdminProductDetail(initial.id());
        assertThat(persisted.media()).extracting(media -> media.url())
                .containsExactly("/new.mp4", "/updated.jpg");
        assertThat(persisted.media().get(1).id()).isEqualTo(keptId);
    }

    @Test
    void foreignMediaIdRollsBackProductAndPreviouslyEditedGalleryEntries() {
        var original = createProduct("Original product");
        var other = createProduct("Other product");
        assertThatThrownBy(() -> productService.updateProduct(original.id(), update("Should roll back", List.of(
                new ProductMediaItemRequest(original.media().getFirst().id(), MediaType.IMAGE, "/changed.jpg", null, 0),
                new ProductMediaItemRequest(other.media().getFirst().id(), MediaType.IMAGE, "/foreign.jpg", null, 1)))))
                .isInstanceOf(ResourceNotFoundException.class);

        var persisted = productService.getAdminProductDetail(original.id());
        assertThat(persisted.name()).isEqualTo("Original product");
        assertThat(persisted.media()).extracting(media -> media.url()).containsExactly("/original.jpg", "/removed.jpg");
    }

    @Test
    void omittedGalleryPreservesMediaAndEmptyGalleryRemovesAllMedia() {
        var original = createProduct("Original product");
        assertThat(productService.updateProduct(original.id(), update("Preserved", null)).media()).hasSize(2);
        assertThat(productService.updateProduct(original.id(), update("Cleared", List.of())).media()).isEmpty();
        assertThat(productService.getAdminProductDetail(original.id()).media()).isEmpty();
    }

    @Test
    void listedPriceMustBePositiveAndHaveApprovedPrecision() {
        var request = createRequest("Zero price", BigDecimal.ZERO);
        assertThat(validator.validate(request)).anyMatch(violation -> violation.getPropertyPath().toString().equals("price"));
        assertThat(validator.validate(createRequest("Negative price", new BigDecimal("-0.01"))))
                .anyMatch(violation -> violation.getPropertyPath().toString().equals("price"));
        assertThat(validator.validate(createRequest("Too precise", new BigDecimal("1.001"))))
                .anyMatch(violation -> violation.getPropertyPath().toString().equals("price"));
        assertThat(validator.validate(createRequest("Too large", new BigDecimal("1000000000000"))))
                .anyMatch(violation -> violation.getPropertyPath().toString().equals("price"));
    }

    @Test
    void lowStockThresholdDefaultsToFiveAndZeroDisablesOnlyTheLowStockWarning() {
        var original = createProduct("Threshold product");
        assertThat(original.lowStockThreshold()).isEqualTo(5);
        jdbcTemplate.update("UPDATE inventories SET quantity = 5 WHERE product_id = ?", original.id());
        assertThat(productService.getProductDetail(original.id()).availability()).isEqualTo("LOW_STOCK");
        var request = new UpdateProductRequest("Threshold updated", null, new BigDecimal("100.25"), category.getId(),
                null, null, null, null, null, null, null, true, null, 0, null, BigDecimal.ZERO);
        assertThat(validator.validate(request)).isEmpty();
        productService.updateProduct(original.id(), request);
        assertThat(productService.getProductDetail(original.id()).availability()).isEqualTo("IN_STOCK");
        assertThat(productService.updateProduct(original.id(), update("Threshold preserved", null)).lowStockThreshold()).isZero();
        jdbcTemplate.update("UPDATE inventories SET quantity = 0 WHERE product_id = ?", original.id());
        assertThat(productService.getProductDetail(original.id()).availability()).isEqualTo("OUT_OF_STOCK");
        var invalid = new UpdateProductRequest("Invalid threshold", null, BigDecimal.ZERO, category.getId(),
                null, null, null, null, null, null, null, true, null, -1, null, BigDecimal.ZERO);
        assertThat(validator.validate(invalid)).anyMatch(violation -> violation.getPropertyPath().toString().equals("lowStockThreshold"));
    }

    private AdminProductDetailResponse createProduct(String name) {
        var product = productService.createProduct(createRequest(name, new BigDecimal("100.25")));
        createdProductIds.add(product.id());
        return product;
    }

    private CreateProductRequest createRequest(String name, BigDecimal price) {
        return new CreateProductRequest("P-" + UUID.randomUUID(), null, name, price, category.getId(),
                null, null, null, null, null, null, null, List.of(
                new CreateProductMediaRequest(MediaType.IMAGE, "/original.jpg", "Original", 0),
                new CreateProductMediaRequest(MediaType.IMAGE, "/removed.jpg", "Removed", 1)), null, null, BigDecimal.ZERO);
    }

    private UpdateProductRequest update(String name, List<ProductMediaItemRequest> media) {
        return new UpdateProductRequest(name, null, new BigDecimal("100.25"), category.getId(),
                null, null, null, null, null, null, null, true, media, null, null, BigDecimal.ZERO);
    }
}
