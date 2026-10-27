package com.m4n.backend.service;

import com.m4n.backend.dto.response.InventoryItemResponse;
import com.m4n.backend.entity.Category;
import com.m4n.backend.entity.Inventory;
import com.m4n.backend.entity.MediaType;
import com.m4n.backend.entity.Product;
import com.m4n.backend.entity.ProductMedia;
import com.m4n.backend.repository.CategoryRepository;
import com.m4n.backend.repository.InventoryRepository;
import com.m4n.backend.repository.ProductRepository;
import com.m4n.backend.repository.ProductMediaRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Transactional
class InventoryStatusIntegrationTest {

    @Autowired
    private InventoryService inventoryService;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private InventoryRepository inventoryRepository;

    @Autowired
    private ProductMediaRepository productMediaRepository;

    @Test
    void backendInventoryStatusesAndLowStockFilterMatchTheUiContract() {
        Category category = categoryRepository.findAll().stream().findFirst().orElseThrow();
        String prefix = "STATUS-" + UUID.randomUUID().toString().substring(0, 8);
        createInventory(category, prefix + "-0", 0);
        Product lowProduct = createInventory(category, prefix + "-5", 5);
        createInventory(category, prefix + "-6", 6);
        productMediaRepository.save(ProductMedia.builder().product(lowProduct)
                .mediaType(MediaType.IMAGE).url("/secondary.jpg").sortOrder(2).build());
        productMediaRepository.save(ProductMedia.builder().product(lowProduct)
                .mediaType(MediaType.IMAGE).url("/primary.jpg").sortOrder(1).build());

        Map<String, InventoryItemResponse> rows = inventoryService
                .listInventory(prefix, null, PageRequest.of(0, 10))
                .stream()
                .collect(Collectors.toMap(InventoryItemResponse::getProductCode, item -> item));

        assertThat(rows).hasSize(3);
        assertThat(rows.get(prefix + "-0").getStatus()).isEqualTo("OUT_OF_STOCK");
        assertThat(rows.get(prefix + "-0").getStatusLabel()).isEqualTo("Hết hàng");
        assertThat(rows.get(prefix + "-5").getStatus()).isEqualTo("LOW_STOCK");
        assertThat(rows.get(prefix + "-5").getStatusLabel()).isEqualTo("Sắp hết hàng");
        assertThat(rows.get(prefix + "-5").getPrimaryImage()).isEqualTo("/primary.jpg");
        assertThat(rows.get(prefix + "-6").getStatus()).isEqualTo("IN_STOCK");
        assertThat(rows.get(prefix + "-6").getStatusLabel()).isEqualTo("Còn hàng");

        var firstPage = inventoryService.listInventory(prefix, null, PageRequest.of(0, 2));
        assertThat(firstPage.getContent()).hasSize(2);
        assertThat(firstPage.getTotalElements()).isEqualTo(3);

        var sorted = inventoryService.listInventory(prefix, null,
                PageRequest.of(0, 3, Sort.by(Sort.Direction.DESC, "quantity")));
        assertThat(sorted.getContent()).extracting(InventoryItemResponse::getQuantity).containsExactly(6, 5, 0);

        var lowStock = inventoryService.listInventory(prefix, "LOW_STOCK", PageRequest.of(0, 10));
        assertThat(lowStock.getContent())
                .extracting(InventoryItemResponse::getProductCode)
                .containsExactly(prefix + "-5");
    }

    private Product createInventory(Category category, String code, int quantity) {
        Product product = productRepository.save(Product.builder()
                .code(code)
                .barcode(code)
                .name(code)
                .price(new BigDecimal("100000"))
                .category(category)
                .media(new ArrayList<>())
                .isActive(true)
                .build());
        inventoryRepository.save(Inventory.builder().product(product).quantity(quantity).build());
        return product;
    }

    @Test
    void configuredProductThresholdControlsInventoryFiltersAndZeroDisablesLowStock() {
        Category category = categoryRepository.findAll().getFirst();
        String prefix = "THRESHOLD-" + UUID.randomUUID().toString().substring(0, 8);
        Product highThreshold = createInventory(category, prefix + "-HIGH", 8);
        highThreshold.setLowStockThreshold(10);
        productRepository.save(highThreshold);
        Product zeroThreshold = createInventory(category, prefix + "-ZERO", 1);
        zeroThreshold.setLowStockThreshold(0);
        productRepository.save(zeroThreshold);

        var lowStock = inventoryService.listInventory(prefix, "LOW_STOCK", PageRequest.of(0, 10));
        assertThat(lowStock.getContent()).extracting(InventoryItemResponse::getProductCode)
                .containsExactly(highThreshold.getCode());
        var available = inventoryService.listInventory(prefix, "IN_STOCK", PageRequest.of(0, 10));
        assertThat(available.getContent()).extracting(InventoryItemResponse::getProductCode)
                .containsExactly(zeroThreshold.getCode());
    }
}
