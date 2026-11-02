package com.m4n.backend.service;

import com.m4n.backend.dto.response.InventoryItemResponse;
import com.m4n.backend.entity.Category;
import com.m4n.backend.entity.Inventory;
import com.m4n.backend.entity.Product;
import com.m4n.backend.repository.InventoryRepository;
import com.m4n.backend.repository.InventoryMovementRepository;
import com.m4n.backend.repository.ProductMediaRepository;
import com.m4n.backend.service.serviceImpl.InventoryServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.never;

@ExtendWith(MockitoExtension.class)
class InventoryServiceTest {

    @Mock
    private InventoryRepository inventoryRepository;

    @Mock
    private InventoryMovementRepository inventoryMovementRepository;

    @Mock
    private ProductMediaRepository productMediaRepository;

    private InventoryService inventoryService;

    private Product sampleProduct;
    private Inventory sampleInventory;

    @BeforeEach
    void setUp() {
        inventoryService = new InventoryServiceImpl(inventoryRepository,
                inventoryMovementRepository, productMediaRepository);

        Category category = Category.builder().id(1L).name("Nhạc cụ dây").build();

        sampleProduct = Product.builder()
                .id(10L)
                .code("TRN-001")
                .barcode("8938500000018")
                .name("Đàn Tranh 16 Dây")
                .price(new BigDecimal("8500000"))
                .category(category)
                .media(new ArrayList<>())
                .isActive(true)
                .build();

        sampleInventory = Inventory.builder()
                .id(100L)
                .product(sampleProduct)
                .quantity(15)
                .updatedAt(Instant.now())
                .build();
    }

    @Test
    @DisplayName("listInventory should return paginated mapped items with stock status")
    void shouldListInventoryWithStatus() {
        Pageable pageable = PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "quantity", "id"));
        Page<Inventory> page = new PageImpl<>(List.of(sampleInventory), pageable, 1);

        when(inventoryRepository.searchInventories(eq("Tranh"), eq("IN_STOCK"), eq(pageable)))
                .thenReturn(page);

        Page<InventoryItemResponse> result = inventoryService.listInventory("Tranh", "IN_STOCK", pageable);

        assertThat(result).isNotNull();
        assertThat(result.getTotalElements()).isEqualTo(1);
        InventoryItemResponse item = result.getContent().getFirst();
        assertThat(item.getProductCode()).isEqualTo("TRN-001");
        assertThat(item.getBarcode()).isEqualTo("8938500000018");
        assertThat(item.getQuantity()).isEqualTo(15);
        assertThat(item.getStatus()).isEqualTo("IN_STOCK");
        assertThat(item.getStatusLabel()).isEqualTo("Còn hàng");
    }

    @Test
    @DisplayName("listInventory should distinguish low-stock and out-of-stock items")
    void shouldMapLowAndOutOfStockStatuses() {
        Pageable pageable = PageRequest.of(0, 10);
        Inventory lowStock = Inventory.builder()
                .id(101L)
                .product(sampleProduct)
                .quantity(5)
                .updatedAt(Instant.now())
                .build();
        Inventory outOfStock = Inventory.builder()
                .id(102L)
                .product(sampleProduct)
                .quantity(0)
                .updatedAt(Instant.now())
                .build();
        Page<Inventory> page = new PageImpl<>(List.of(lowStock, outOfStock), pageable, 2);

        when(inventoryRepository.searchInventories(eq(null), eq(null), eq(pageable)))
                .thenReturn(page);

        Page<InventoryItemResponse> result = inventoryService.listInventory(null, null, pageable);

        assertThat(result.getContent())
                .extracting(InventoryItemResponse::getStatus, InventoryItemResponse::getStatusLabel)
                .containsExactly(
                        org.assertj.core.groups.Tuple.tuple("LOW_STOCK", "Sắp hết hàng"),
                        org.assertj.core.groups.Tuple.tuple("OUT_OF_STOCK", "Hết hàng")
                );
    }

    @Test
    void inventoryListShouldRejectUnsupportedNestedSort() {
        assertThatThrownBy(() -> inventoryService.listInventory(null, null,
                PageRequest.of(0, 10, Sort.by("product.name"))))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("sắp xếp");
        verify(inventoryRepository, never()).searchInventories(any(), any(), any());
    }

}
