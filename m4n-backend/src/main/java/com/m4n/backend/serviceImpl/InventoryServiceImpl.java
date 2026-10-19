package com.m4n.backend.serviceImpl;

import com.m4n.backend.dto.request.StockImportRequest;
import com.m4n.backend.dto.response.InventoryItemResponse;
import com.m4n.backend.dto.response.StockImportResponse;
import com.m4n.backend.entity.Inventory;
import com.m4n.backend.entity.Product;
import com.m4n.backend.entity.ProductMedia;
import com.m4n.backend.exception.ResourceNotFoundException;
import com.m4n.backend.repository.InventoryRepository;
import com.m4n.backend.repository.ProductRepository;
import com.m4n.backend.service.InventoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Slf4j
@Service
@RequiredArgsConstructor
public class InventoryServiceImpl implements InventoryService {

    private final InventoryRepository inventoryRepository;
    private final ProductRepository productRepository;

    @Override
    @Transactional(readOnly = true)
    public Page<InventoryItemResponse> listInventory(String keyword, String status, Pageable pageable) {
        String cleanKeyword = (keyword != null && !keyword.isBlank()) ? keyword.trim() : null;
        String cleanStatus = (status != null && !status.isBlank() && !status.equalsIgnoreCase("ALL"))
                ? status.trim().toUpperCase()
                : null;

        return inventoryRepository.searchInventories(cleanKeyword, cleanStatus, pageable)
                .map(this::mapToResponse);
    }

    @Override
    @Transactional
    public StockImportResponse importStock(Long productId, StockImportRequest request) {
        if (productId == null) {
            throw new IllegalArgumentException("ID sản phẩm không hợp lệ");
        }
        if (request.getQuantity() == null || request.getQuantity() <= 0) {
            throw new IllegalArgumentException("Số lượng nhập kho phải là số nguyên dương lớn hơn 0");
        }

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Sản phẩm không tồn tại: " + productId));

        // Concurrency-safe: lock inventory row with PESSIMISTIC_WRITE
        Inventory inventory = inventoryRepository.findByProductIdWithLock(productId)
                .orElseGet(() -> Inventory.builder()
                        .product(product)
                        .quantity(0)
                        .updatedAt(Instant.now())
                        .build()
                );

        int previousQuantity = inventory.getQuantity() != null ? inventory.getQuantity() : 0;
        int newQuantity = previousQuantity + request.getQuantity();

        inventory.setQuantity(newQuantity);
        inventory.setUpdatedAt(Instant.now());
        Inventory saved = inventoryRepository.save(inventory);

        log.info("Stock imported successfully for product [{} - {}]: previous={}, imported={}, new={}",
                product.getCode(), product.getName(), previousQuantity, request.getQuantity(), newQuantity);

        return StockImportResponse.builder()
                .productId(product.getId())
                .productName(product.getName())
                .productCode(product.getCode())
                .previousQuantity(previousQuantity)
                .importedQuantity(request.getQuantity())
                .newQuantity(saved.getQuantity())
                .message("Nhập kho thành công cho sản phẩm '" + product.getName() + "'.")
                .updatedAt(saved.getUpdatedAt())
                .build();
    }

    private InventoryItemResponse mapToResponse(Inventory inventory) {
        Product product = inventory.getProduct();
        int qty = inventory.getQuantity() != null ? inventory.getQuantity() : 0;

        String status;
        String statusLabel;
        if (qty > 5) {
            status = "IN_STOCK";
            statusLabel = "Còn hàng";
        } else if (qty > 0) {
            status = "LOW_STOCK";
            statusLabel = "Sắp hết hàng";
        } else {
            status = "OUT_OF_STOCK";
            statusLabel = "Hết hàng";
        }

        String primaryImage = null;
        if (product.getMedia() != null && !product.getMedia().isEmpty()) {
            primaryImage = product.getMedia().stream()
                    .map(ProductMedia::getUrl)
                    .findFirst()
                    .orElse(null);
        }

        return InventoryItemResponse.builder()
                .id(inventory.getId())
                .productId(product.getId())
                .productCode(product.getCode())
                .barcode(product.getBarcode())
                .productName(product.getName())
                .categoryName(product.getCategory() != null ? product.getCategory().getName() : null)
                .price(product.getPrice())
                .quantity(qty)
                .status(status)
                .statusLabel(statusLabel)
                .primaryImage(primaryImage)
                .updatedAt(inventory.getUpdatedAt())
                .build();
    }
}
