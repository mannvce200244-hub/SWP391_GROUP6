package com.m4n.backend.service;

import com.m4n.backend.dto.request.StockImportRequest;
import com.m4n.backend.dto.response.InventoryItemResponse;
import com.m4n.backend.dto.response.StockImportResponse;
import com.m4n.backend.entity.Category;
import com.m4n.backend.entity.Inventory;
import com.m4n.backend.entity.Product;
import com.m4n.backend.exception.ResourceNotFoundException;
import com.m4n.backend.repository.InventoryRepository;
import com.m4n.backend.repository.ProductRepository;
import com.m4n.backend.serviceImpl.InventoryServiceImpl;
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

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InventoryServiceTest {

    @Mock
    private InventoryRepository inventoryRepository;

    @Mock
    private ProductRepository productRepository;

    private InventoryService inventoryService;

    private Product sampleProduct;
    private Inventory sampleInventory;

    @BeforeEach
    void setUp() {
        inventoryService = new InventoryServiceImpl(inventoryRepository, productRepository);

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
        Pageable pageable = PageRequest.of(0, 10);
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
    @DisplayName("importStock should atomically add quantity and return updated response")
    void shouldImportStockSuccessfully() {
        when(productRepository.findById(10L)).thenReturn(Optional.of(sampleProduct));
        when(inventoryRepository.findByProductIdWithLock(10L)).thenReturn(Optional.of(sampleInventory));
        when(inventoryRepository.save(any(Inventory.class))).thenAnswer(invocation -> invocation.getArgument(0));

        StockImportRequest request = new StockImportRequest(5, "Bổ sung kho showroom");
        StockImportResponse response = inventoryService.importStock(10L, request);

        assertThat(response).isNotNull();
        assertThat(response.getProductId()).isEqualTo(10L);
        assertThat(response.getPreviousQuantity()).isEqualTo(15);
        assertThat(response.getImportedQuantity()).isEqualTo(5);
        assertThat(response.getNewQuantity()).isEqualTo(20);
        assertThat(sampleInventory.getQuantity()).isEqualTo(20);

        verify(inventoryRepository).save(sampleInventory);
    }

    @Test
    @DisplayName("importStock should reject non-positive quantity")
    void shouldRejectNonPositiveQuantity() {
        StockImportRequest zeroRequest = new StockImportRequest(0, null);
        assertThatThrownBy(() -> inventoryService.importStock(10L, zeroRequest))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Số lượng nhập kho phải là số nguyên dương lớn hơn 0");

        StockImportRequest negativeRequest = new StockImportRequest(-3, null);
        assertThatThrownBy(() -> inventoryService.importStock(10L, negativeRequest))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("importStock should throw ResourceNotFoundException when product does not exist")
    void shouldThrowWhenProductNotFound() {
        when(productRepository.findById(999L)).thenReturn(Optional.empty());

        StockImportRequest request = new StockImportRequest(5, null);
        assertThatThrownBy(() -> inventoryService.importStock(999L, request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Sản phẩm không tồn tại");
    }
}
