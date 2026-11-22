package com.m4n.backend.service.serviceImpl;



import com.m4n.backend.dto.response.InventoryItemResponse;
import com.m4n.backend.dto.response.InventoryMovementResponse;

import com.m4n.backend.entity.Inventory;
import com.m4n.backend.entity.InventoryMovement;
import com.m4n.backend.entity.Product;
import com.m4n.backend.entity.ProductMedia;
import com.m4n.backend.entity.MediaType;

import com.m4n.backend.repository.InventoryRepository;
import com.m4n.backend.repository.InventoryMovementRepository;
import com.m4n.backend.repository.ProductMediaRepository;
import com.m4n.backend.service.InventoryService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.beans.factory.annotation.Autowired;


import java.util.List;
import java.util.Map;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class InventoryServiceImpl implements InventoryService {

    private final InventoryRepository inventoryRepository;
    private final InventoryMovementRepository inventoryMovementRepository;
    private final ProductMediaRepository productMediaRepository;
    private final com.m4n.backend.repository.ProductRepository productRepository;

    @Autowired
    public InventoryServiceImpl(
            InventoryRepository inventoryRepository,
            InventoryMovementRepository inventoryMovementRepository,
            ProductMediaRepository productMediaRepository,
            com.m4n.backend.repository.ProductRepository productRepository
    ) {
        this.inventoryRepository = inventoryRepository;
        this.inventoryMovementRepository = inventoryMovementRepository;
        this.productMediaRepository = productMediaRepository;
        this.productRepository = productRepository;
    }

    @Override @Transactional(readOnly = true)
    public Page<InventoryItemResponse> listInventoryFamilies(String keyword, String status, Pageable pageable) {
        validatePage(pageable);
        if (pageable.getSort().stream().anyMatch(order -> !Set.of("id", "updatedAt").contains(order.getProperty()))) {
            throw new IllegalArgumentException("Sắp xếp sản phẩm trong kho theo mã hoặc thời gian cập nhật.");
        }
        var filter = com.m4n.backend.specification.ProductSpecification.filterAdminProducts(keyword, null, null, null, null);
        var spec = com.m4n.backend.specification.ProductSpecification.familyRepresentatives(filter, filter)
                .and(com.m4n.backend.specification.ProductSpecification.familyInventoryStatus(status));
        var products = productRepository.findAll(spec, pageable);
        var ids = products.getContent().stream().map(Product::getId).toList();
        var familyIds = products.getContent().stream().filter(p -> p.getFamily() != null).map(p -> p.getFamily().getId()).distinct().toList();
        var totals = familyIds.isEmpty() ? Map.<Long, com.m4n.backend.repository.ProductRepository.FamilyInventoryTotals>of()
                : productRepository.familyInventoryTotals(familyIds).stream().collect(Collectors.toMap(
                    com.m4n.backend.repository.ProductRepository.FamilyInventoryTotals::getFamilyId, value -> value));
        var stocks = ids.isEmpty() ? Map.<Long, Inventory>of() : inventoryRepository.findByProductIdIn(ids).stream()
                .collect(Collectors.toMap(item -> item.getProduct().getId(), value -> value));
        return products.map(product -> {
            var stock = stocks.getOrDefault(product.getId(), Inventory.builder().product(product).quantity(0).build());
            var response = mapToResponse(stock, Map.of());
            response.setProductName(product.getFamilyName());
            response.setVariantCount(1L);
            if (product.getFamily() != null) {
                var total = totals.get(product.getFamily().getId());
                response.setFamilyId(product.getFamily().getId());
                if (total != null) {
                    response.setQuantity(total.getQuantity());
                    response.setVariantCount(total.getVariantCount());
                    response.setStatus(total.getQuantity() <= 0 ? "OUT_OF_STOCK" : total.getQuantity() <= total.getThreshold() ? "LOW_STOCK" : "IN_STOCK");
                    response.setStatusLabel(response.getStatus().equals("OUT_OF_STOCK") ? "Hết hàng" : response.getStatus().equals("LOW_STOCK") ? "Sắp hết hàng" : "Còn hàng");
                }
            }
            return response;
        });
    }

    @Override
    @Transactional(readOnly = true)
    public Page<InventoryItemResponse> listInventory(String keyword, String status, Pageable pageable) {
        validateSort(pageable);
        String cleanKeyword = (keyword != null && !keyword.isBlank()) ? keyword.trim() : null;
        String cleanStatus = (status != null && !status.isBlank() && !status.equalsIgnoreCase("ALL"))
                ? status.trim().toUpperCase(Locale.ROOT)
                : null;
        if (cleanStatus != null && !Set.of("IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK").contains(cleanStatus)) {
            throw new IllegalArgumentException("Trạng thái tồn kho không hợp lệ.");
        }

        Page<Inventory> page = inventoryRepository.searchInventories(cleanKeyword, cleanStatus, pageable);
        List<Long> productIds = page.getContent().stream()
                .map(inventory -> inventory.getProduct().getId())
                .toList();
        Map<Long, String> primaryImages = productIds.isEmpty()
                ? Map.of()
                : productMediaRepository.findByProductIdInOrderBySortOrderAscIdAsc(productIds).stream()
                .filter(media -> media.getMediaType() == MediaType.IMAGE)
                .collect(Collectors.toMap(
                        media -> media.getProduct().getId(),
                        ProductMedia::getUrl,
                        (first, ignored) -> first
                ));
        return page.map(inventory -> mapToResponse(inventory, primaryImages));
    }

    private void validateSort(Pageable pageable) {
        validatePage(pageable);
        Set<String> allowedProperties = Set.of("id", "quantity", "updatedAt");
        if (pageable.getSort().stream().anyMatch(order -> !allowedProperties.contains(order.getProperty()))) {
            throw new IllegalArgumentException("Trường sắp xếp tồn kho không được hỗ trợ.");
        }
    }

    @Override
    @Transactional
    public void recordMovement(InventoryMovement movement) {
        movement.setProductCode(movement.getProduct().getCode());
        movement.setProductName(movement.getProduct().getDisplayName());
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        movement.setActorEmail(authentication == null ? null : authentication.getName());
        inventoryMovementRepository.save(movement);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<InventoryMovementResponse> listMovements(Long productId, String type, Pageable pageable) {
        return listMovements(productId, null, type, pageable);
    }

    @Override @Transactional(readOnly = true)
    public Page<InventoryMovementResponse> listMovements(Long productId, Long familyId, String type, Pageable pageable) {
        if (familyId != null && (familyId <= 0 || productId != null)) throw new IllegalArgumentException("Chọn một sản phẩm hoặc một SKU hợp lệ để xem lịch sử.");
        validatePage(pageable);
        if (pageable.getSort().stream().anyMatch(order -> !Set.of("id", "createdAt").contains(order.getProperty()))) {
            throw new IllegalArgumentException("Trường sắp xếp lịch sử kho không được hỗ trợ.");
        }
        String normalizedType = type == null || type.isBlank() ? null : type.trim().toUpperCase(Locale.ROOT);
        if (normalizedType != null && !Set.of("IMPORT", "RECEIPT", "ISSUE", "ORDER_CONFIRMATION", "POS_SALE", "ORDER_CANCELLATION").contains(normalizedType)) {
            throw new IllegalArgumentException("Loại biến động kho không hợp lệ.");
        }
        var movements = familyId == null ? inventoryMovementRepository.search(productId, normalizedType, pageable)
                : inventoryMovementRepository.searchFamily(familyId, normalizedType, pageable);
        return movements.map(movement -> {
            Product product = movement.getProduct();
            return new InventoryMovementResponse(movement.getId(), product.getId(),
                    movement.getProductCode() == null ? product.getCode() : movement.getProductCode(),
                    movement.getProductName() == null ? product.getDisplayName() : movement.getProductName(),
                    movement.getType(), movement.getQuantity(), movement.getQuantityBefore(), movement.getQuantityAfter(),
                    movement.getRejectedQuantity() == null ? 0 : movement.getRejectedQuantity(), movement.getRejectionReason(),
                    movement.getReason(), movement.getActorEmail(), movement.getCreatedAt(), movement.getSourceType(), movement.getSourceId());
        });
    }

    private void validatePage(Pageable pageable) {
        if (pageable.isPaged() && pageable.getOffset() > Integer.MAX_VALUE) {
            throw new IllegalArgumentException("Trang yêu cầu vượt giới hạn phân trang. Vui lòng chọn trang nhỏ hơn.");
        }
    }

    private InventoryItemResponse mapToResponse(Inventory inventory, Map<Long, String> primaryImages) {
        Product product = inventory.getProduct();
        int qty = inventory.getQuantity() != null ? inventory.getQuantity() : 0;

        String status;
        String statusLabel;
        int threshold = product.getLowStockThreshold() == null ? 5 : product.getLowStockThreshold();
        if (qty > threshold) {
            status = "IN_STOCK";
            statusLabel = "Còn hàng";
        } else if (qty > 0) {
            status = "LOW_STOCK";
            statusLabel = "Sắp hết hàng";
        } else {
            status = "OUT_OF_STOCK";
            statusLabel = "Hết hàng";
        }

        return InventoryItemResponse.builder()
                .id(inventory.getId())
                .productId(product.getId())
                .productCode(product.getCode())
                .barcode(product.getBarcode())
                .productName(product.getDisplayName())
                .categoryName(product.getCategory() != null ? product.getCategory().getName() : null)
                .price(product.getPrice())
                .quantity((long) qty)
                .status(status)
                .statusLabel(statusLabel)
                .primaryImage(primaryImages.get(product.getId()))
                .updatedAt(inventory.getUpdatedAt())
                .build();
    }
}
