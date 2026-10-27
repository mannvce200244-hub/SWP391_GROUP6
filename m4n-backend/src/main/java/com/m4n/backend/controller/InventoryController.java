package com.m4n.backend.controller;

import com.m4n.backend.dto.request.StockImportRequest;
import com.m4n.backend.dto.request.StockIssueRequest;
import com.m4n.backend.dto.response.InventoryItemResponse;
import com.m4n.backend.dto.response.StockDocumentResponse;
import com.m4n.backend.dto.response.InventoryMovementResponse;
import com.m4n.backend.dto.request.ConfirmStockDocumentRequest;
import com.m4n.backend.entity.StockDocumentType;
import com.m4n.backend.entity.StockDocumentStatus;
import com.m4n.backend.service.InventoryService;
import com.m4n.backend.service.StockDocumentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/inventory")
@RequiredArgsConstructor
@Tag(name = "Inventory Management", description = "Back-office inventory and stock import operations")
public class InventoryController {

    private final InventoryService inventoryService;
    private final StockDocumentService stockDocumentService;

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(summary = "List and search inventory items", description = "Returns paginated list of products with current sellable inventory and stock status.")
    public ResponseEntity<Page<InventoryItemResponse>> listInventory(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status,
            @PageableDefault(size = 10, sort = "id", direction = Sort.Direction.ASC) Pageable pageable
    ) {
        return ResponseEntity.ok(inventoryService.listInventory(keyword, status, pageable));
    }

    @PostMapping("/{productId}/import")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(summary = "Create stock receipt draft", description = "Creates a draft; sellable inventory is unchanged until authorized confirmation.")
    public ResponseEntity<StockDocumentResponse> importStock(
            @PathVariable Long productId,
            @Valid @RequestBody StockImportRequest request
    ) {
        return ResponseEntity.ok(stockDocumentService.createReceipt(productId, request));
    }

    @PostMapping("/{productId}/issue")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(summary = "Create stock issue draft", description = "Creates a draft without reducing inventory.")
    public ResponseEntity<StockDocumentResponse> issueStock(
            @PathVariable Long productId,
            @Valid @RequestBody StockIssueRequest request
    ) {
        return ResponseEntity.ok(stockDocumentService.createIssue(productId, request));
    }

    @GetMapping("/documents")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<Page<StockDocumentResponse>> documents(
            @RequestParam(required = false) Long productId,
            @RequestParam(required = false) StockDocumentType type,
            @RequestParam(required = false) StockDocumentStatus status,
            @PageableDefault(size = 10, sort = {"createdAt", "id"}, direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(stockDocumentService.list(productId, type, status, pageable));
    }

    @PostMapping("/documents/{id}/confirm")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<StockDocumentResponse> confirmDocument(@PathVariable Long id,
            @Valid @RequestBody ConfirmStockDocumentRequest request) {
        return ResponseEntity.ok(stockDocumentService.confirm(id, request));
    }

    @GetMapping("/movements")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<Page<InventoryMovementResponse>> movements(
            @RequestParam(required = false) Long productId, @RequestParam(required = false) String type,
            @PageableDefault(size = 10, sort = {"createdAt", "id"}, direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(inventoryService.listMovements(productId, type, pageable));
    }
}
