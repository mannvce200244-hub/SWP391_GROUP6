package com.m4n.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "payment_attempts", indexes = @Index(name = "ix_payment_attempt_order", columnList = "order_id,id"))
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class PaymentAttempt {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "order_id", nullable = false)
    private Order order;
    @Column(nullable = false, unique = true, length = 100)
    private String transactionReference;
    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal amount;
    @Column(nullable = false, length = 14)
    private String providerCreateDate;
    @Column(nullable = false)
    private Instant expiresAt;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20)
    private PaymentState state;
    @Column(length = 15)
    private String transactionNo;
    @Column(length = 20)
    private String bankCode;
    @Column(length = 14)
    private String payDate;
    @Column(length = 2)
    private String responseCode;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20)
    private RefundState refundState;
    @Column(length = 32)
    private String refundRequestId;
    @Column(length = 14)
    private String refundCreateDate;
    @Column(length = 500)
    private String refundReason;
    @Column(length = 245)
    private String refundCreateBy;
    @Column(length = 32)
    private String refundResponseId;
    @Column(length = 15)
    private String refundTransactionNo;
    @Column(length = 2)
    private String refundResponseCode;
}
