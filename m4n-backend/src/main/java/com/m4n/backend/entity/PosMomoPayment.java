package com.m4n.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;

/** Durable payment intent; an invoice exists only after verified payment and atomic stock deduction. */
@Entity
@Table(name = "pos_momo_payments", indexes = @Index(name = "ix_pos_momo_staff_created", columnList = "staff_id,created_at"))
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class PosMomoPayment {
    @Id @Column(length = 40)
    private String id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "staff_id", nullable = false)
    private User staff;
    @Column(nullable = false, columnDefinition = "text")
    private String bill;
    @Column(name = "customer_email", nullable = false, length = 255)
    private String customerEmail;
    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal amount;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20)
    private PaymentState state;
    @Enumerated(EnumType.STRING) @Column(name = "refund_state", nullable = false, length = 20)
    private RefundState refundState;
    @Column(name = "cancel_requested", nullable = false)
    private boolean cancelRequested;
    @Column(name = "payment_url", length = 2000)
    private String paymentUrl;
    @Column(name = "transaction_no", length = 32)
    private String transactionNo;
    @Column(name = "refund_reference", length = 40)
    private String refundReference;
    @Column(name = "refund_transaction_no", length = 32)
    private String refundTransactionNo;
    @Column(name = "response_code", length = 10)
    private String responseCode;
    @Column(name = "refund_response_code", length = 10)
    private String refundResponseCode;
    @Column(name = "failure_reason", length = 500)
    private String failureReason;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_id", unique = true)
    private Invoice invoice;
    @Column(name = "receipt_email_queued_at")
    private Instant receiptEmailQueuedAt;
    @Column(name = "receipt_email_attempted_at")
    private Instant receiptEmailAttemptedAt;
    @Column(name = "receipt_email_sent_at")
    private Instant receiptEmailSentAt;
}
