package com.m4n.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockImportResponse {
    private Long productId;
    private String productName;
    private String productCode;
    private Integer previousQuantity;
    private Integer importedQuantity;
    private Integer newQuantity;
    private String message;
    private Instant updatedAt;
}
