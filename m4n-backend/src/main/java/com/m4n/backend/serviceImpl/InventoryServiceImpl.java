package com.m4n.backend.serviceImpl;

import com.m4n.backend.dto.request.StockImportRequest;
import com.m4n.backend.dto.request.StockIssueRequest;
import com.m4n.backend.dto.response.InventoryItemResponse;
import com.m4n.backend.dto.response.StockImportResponse;
import com.m4n.backend.dto.response.StockIssueResponse;
import com.m4n.backend.entity.Inventory;
import com.m4n.backend.entity.InventoryMovement;
import com.m4n.backend.entity.Product;
import com.m4n.backend.entity.ProductMedia;
import com.m4n.backend.exception.ResourceNotFoundException;
import com.m4n.backend.repository.InventoryRepository;
import com.m4n.backend.repository.InventoryMovementRepository;
import com.m4n.backend.repository.ProductRepository;
import com.m4n.backend.service.InventoryService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.Instant;

@Slf4j
@Service
public class InventoryServiceImpl implements InventoryService {

    private final InventoryRepository inventoryRepository;
    private final ProductRepository productRepository;
    private final InventoryMovementRepository inventoryMovementRepository;

    @Autowired
    public InventoryServiceImpl(
            InventoryRepository inventoryRepository,
            ProductRepository productRepository,
            InventoryMovementRepository inventoryMovementRepository
    ) {
        this.inventoryRepository = inventoryRepository;
        this.productRepository = productRepository;
        this.inventoryMovementRepository = inventoryMovementRepository;
    }

    public InventoryServiceImpl(InventoryRepository inventoryRepository, ProductRepository productRepository) {
        this(inventoryRepository, productRepository, null);
    }

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

        saveMovement(product, "IMPORT", request.getQuantity(), previousQuantity, newQuantity,
                request.getNotes() == null || request.getNotes().isBlank() ? "Nhập kho" : request.getNotes().trim());

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

    @Override
    @Transactional
    public StockIssueResponse issueStock(Long productId, StockIssueRequest request) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Sản phẩm không tồn tại: " + productId));
        Inventory inventory = inventoryRepository.findByProductIdWithLock(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Chưa có tồn kho cho sản phẩm: " + productId));
        int previous = inventory.getQuantity() == null ? 0 : inventory.getQuantity();
        if (request.quantity() > previous) {
            throw new IllegalArgumentException("Số lượng xuất điều chỉnh không được vượt quá tồn kho hiện tại (" + previous + ").");
        }
        int next = previous - request.quantity();
        inventory.setQuantity(next);
        Inventory saved = inventoryRepository.save(inventory);
        saveMovement(product, "ISSUE", request.quantity(), previous, next, request.reason().trim());
        return new StockIssueResponse(productId, product.getCode(), product.getName(), previous,
                request.quantity(), next, "Đã ghi nhận xuất kho điều chỉnh.", saved.getUpdatedAt());
    }

    private void saveMovement(Product product, String type, int quantity, int before, int after, String reason) {
        if (inventoryMovementRepository == null) return;
        String actor = SecurityContextHolder.getContext().getAuthentication() != null
                ? SecurityContextHolder.getContext().getAuthentication().getName() : null;
        inventoryMovementRepository.save(InventoryMovement.builder()
                .product(product).type(type).quantity(quantity).quantityBefore(before).quantityAfter(after)
                .reason(reason).actorEmail(actor).build());
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
