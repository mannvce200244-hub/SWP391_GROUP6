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
public class RecentOrderResponse {
    private Long id;
    private String orderCode;
    private String customerName;
    private BigDecimal finalAmount;
    private String status;
    private String statusLabel;
    private String paymentMethod;
    private Instant createdAt;
}
