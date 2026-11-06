package com.m4n.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryItemResponse {
    private Long id;
    private Long productId;
    private String productCode;
    private String barcode;
    private String productName;
    private String categoryName;
    private BigDecimal price;
    private Integer quantity;
    private String status;
    private String statusLabel;
    private String primaryImage;
    private Instant updatedAt;
}
