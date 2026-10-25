package com.m4n.backend.controller;

import com.m4n.backend.dto.request.StockImportRequest;
import com.m4n.backend.dto.request.StockIssueRequest;
import com.m4n.backend.dto.response.InventoryItemResponse;
import com.m4n.backend.dto.response.StockImportResponse;
import com.m4n.backend.dto.response.StockIssueResponse;
import com.m4n.backend.service.InventoryService;
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
    @Operation(summary = "Import stock for product", description = "Increases current inventory quantity for a product through backend-authoritative transaction.")
    public ResponseEntity<StockImportResponse> importStock(
            @PathVariable Long productId,
            @Valid @RequestBody StockImportRequest request
    ) {
        return ResponseEntity.ok(inventoryService.importStock(productId, request));
    }

    @PostMapping("/{productId}/issue")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(summary = "Issue stock correction", description = "Reduces inventory through an audited movement; direct stock editing is not allowed.")
    public ResponseEntity<StockIssueResponse> issueStock(
            @PathVariable Long productId,
            @Valid @RequestBody StockIssueRequest request
    ) {
        return ResponseEntity.ok(inventoryService.issueStock(productId, request));
    }
}
