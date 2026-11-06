package com.m4n.backend.service;

import com.m4n.backend.dto.response.InventoryItemResponse;
import com.m4n.backend.dto.response.InventoryMovementResponse;
import com.m4n.backend.entity.InventoryMovement;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface InventoryService {

    Page<InventoryItemResponse> listInventory(String keyword, String status, Pageable pageable);

    Page<InventoryMovementResponse> listMovements(Long productId, String type, Pageable pageable);

    void recordMovement(InventoryMovement movement);
}
