package com.m4n.backend.service;

import com.m4n.backend.dto.request.StockImportRequest;
import com.m4n.backend.dto.request.StockIssueRequest;
import com.m4n.backend.dto.response.InventoryItemResponse;
import com.m4n.backend.dto.response.StockImportResponse;
import com.m4n.backend.dto.response.StockIssueResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface InventoryService {

    Page<InventoryItemResponse> listInventory(String keyword, String status, Pageable pageable);

    StockImportResponse importStock(Long productId, StockImportRequest request);

    StockIssueResponse issueStock(Long productId, StockIssueRequest request);
}
