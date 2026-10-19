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
public class PosProductResponse {
    private Long id;
    private String code;
    private String barcode;
    private String name;
    private BigDecimal price;
    private String formattedPrice;
    private String categoryName;
    private String primaryImage;
    private Integer quantity;
    private String availability;
}
