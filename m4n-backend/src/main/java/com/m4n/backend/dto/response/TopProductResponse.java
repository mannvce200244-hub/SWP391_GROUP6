package com.m4n.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TopProductResponse {
    private Long productId;
    private String productCode;
    private String productName;
    private String categoryName;
    private Long quantitySold;
    private BigDecimal revenue;
}
