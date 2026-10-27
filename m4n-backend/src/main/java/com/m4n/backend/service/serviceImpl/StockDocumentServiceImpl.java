package com.m4n.backend.service.serviceImpl;

import com.m4n.backend.dto.request.ConfirmStockDocumentRequest;
import com.m4n.backend.dto.request.StockImportRequest;
import com.m4n.backend.dto.request.StockIssueRequest;
import com.m4n.backend.dto.response.StockDocumentResponse;
import com.m4n.backend.entity.Inventory;
import com.m4n.backend.entity.InventoryMovement;
import com.m4n.backend.entity.Product;
import com.m4n.backend.entity.StockDocument;
import com.m4n.backend.entity.StockDocumentStatus;
import com.m4n.backend.entity.StockDocumentType;
import com.m4n.backend.exception.ResourceNotFoundException;
import com.m4n.backend.repository.InventoryRepository;
import com.m4n.backend.repository.ProductRepository;
import com.m4n.backend.repository.StockDocumentRepository;
import com.m4n.backend.service.InventoryService;
import com.m4n.backend.service.StockDocumentService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.util.Set;

@Service
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
@Transactional(readOnly = true)
public class StockDocumentServiceImpl implements StockDocumentService {
    private final StockDocumentRepository documentRepository;
    private final ProductRepository productRepository;
    private final InventoryRepository inventoryRepository;
    private final InventoryService inventoryService;

    @Override @Transactional
    public StockDocumentResponse createReceipt(Long productId, StockImportRequest request) {
        return create(productId, request.getQuantity(), request.getNotes(), StockDocumentType.RECEIPT);
    }

    @Override @Transactional
    public StockDocumentResponse createIssue(Long productId, StockIssueRequest request) {
        if (request.reason() == null || request.reason().isBlank()) {
            throw new IllegalArgumentException("Lý do xuất kho không được để trống.");
        }
        return create(productId, request.quantity(), request.reason(), StockDocumentType.ISSUE);
    }

    private StockDocumentResponse create(Long productId, Integer quantity, String reason, StockDocumentType type) {
        if (quantity == null || quantity <= 0) throw new IllegalArgumentException("Số lượng phải là số nguyên lớn hơn 0.");
        String normalizedReason = reason == null || reason.isBlank() ? "Nhập kho" : reason.trim();
        if (normalizedReason.length() > 500) throw new IllegalArgumentException("Lý do không quá 500 ký tự.");
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Sản phẩm không tồn tại: " + productId));
        StockDocument document = StockDocument.builder().product(product).productCode(product.getCode())
                .productName(product.getName()).type(type).status(StockDocumentStatus.DRAFT)
                .quantity(quantity).reason(normalizedReason).createdBy(actor()).build();
        return response(documentRepository.save(document));
    }

    @Override @Transactional
    public StockDocumentResponse confirm(Long documentId, ConfirmStockDocumentRequest request) {
        StockDocument document = documentRepository.findByIdWithLock(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Phiếu kho không tồn tại: " + documentId));
        if (document.getStatus() != StockDocumentStatus.DRAFT) throw new IllegalStateException("Phiếu kho đã được xác nhận.");
        int rejected = request.rejectedQuantity() == null ? 0 : request.rejectedQuantity();
        String rejectionReason = request.rejectionReason() == null ? "" : request.rejectionReason().trim();
        if (rejected < 0 || rejected > document.getQuantity()) throw new IllegalArgumentException("Số lượng bị loại phải từ 0 đến số lượng trên phiếu.");
        if (document.getType() == StockDocumentType.ISSUE && (rejected != 0 || !rejectionReason.isEmpty())) {
            throw new IllegalArgumentException("Phiếu xuất kho không có kiểm tra loại hàng nhập.");
        }
        if (rejected > 0 && rejectionReason.isEmpty()) throw new IllegalArgumentException("Vui lòng nhập lý do loại hàng.");
        if (rejectionReason.length() > 500) throw new IllegalArgumentException("Lý do loại hàng không quá 500 ký tự.");
        Product product = productRepository.findByIdWithLock(document.getProduct().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Sản phẩm không tồn tại."));
        Inventory inventory = inventoryRepository.findByProductIdWithLock(product.getId())
                .orElseGet(() -> Inventory.builder().product(product).quantity(0).build());
        int before = inventory.getQuantity();
        int accepted = document.getQuantity() - rejected;
        int after;
        if (document.getType() == StockDocumentType.RECEIPT) {
            try { after = Math.addExact(before, accepted); }
            catch (ArithmeticException exception) { throw new IllegalArgumentException("Số lượng tồn kho vượt quá giới hạn hỗ trợ."); }
        } else {
            if (before < document.getQuantity()) throw new IllegalArgumentException("Tồn kho không đủ để xác nhận phiếu xuất. Phiếu vẫn chờ xác nhận.");
            after = before - document.getQuantity();
        }
        inventory.setQuantity(after);
        inventory.setUpdatedAt(Instant.now());
        inventoryRepository.save(inventory);
        document.setStatus(StockDocumentStatus.CONFIRMED);
        document.setConfirmedBy(actor());
        document.setConfirmedAt(Instant.now());
        document.setAcceptedQuantity(accepted);
        document.setRejectedQuantity(rejected);
        document.setRejectionReason(rejected == 0 ? null : rejectionReason);
        document.setQuantityBefore(before);
        document.setQuantityAfter(after);
        inventoryService.recordMovement(InventoryMovement.builder().product(product).type(document.getType().name())
                .quantity(accepted).quantityBefore(before).quantityAfter(after).reason(document.getReason())
                .rejectedQuantity(rejected).rejectionReason(document.getRejectionReason())
                .sourceType("STOCK_DOCUMENT").sourceId(document.getId()).build());
        return response(documentRepository.save(document));
    }

    @Override
    public Page<StockDocumentResponse> list(Long productId, StockDocumentType type, StockDocumentStatus status, Pageable pageable) {
        if (pageable.getSort().stream().anyMatch(order -> !Set.of("id", "createdAt", "confirmedAt").contains(order.getProperty()))) {
            throw new IllegalArgumentException("Trường sắp xếp phiếu kho không được hỗ trợ.");
        }
        return documentRepository.search(productId, type, status, pageable).map(this::response);
    }

    private String actor() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getName())) {
            throw new AccessDeniedException("Vui lòng đăng nhập để quản lý kho.");
        }
        return authentication.getName();
    }

    private StockDocumentResponse response(StockDocument document) {
        return new StockDocumentResponse(document.getId(), document.getProduct().getId(), document.getProductCode(),
                document.getProductName(), document.getType(), document.getStatus(), document.getQuantity(), document.getReason(),
                document.getCreatedBy(), document.getCreatedAt(), document.getConfirmedBy(), document.getConfirmedAt(),
                document.getAcceptedQuantity(), document.getRejectedQuantity(), document.getRejectionReason(),
                document.getQuantityBefore(), document.getQuantityAfter());
    }
}
