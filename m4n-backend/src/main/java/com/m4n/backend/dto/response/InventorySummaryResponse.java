package com.m4n.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventorySummaryResponse {
    private Long totalItems;
    private Long availableCount;
    private Long lowStockCount;
    private Long outOfStockCount;
}
