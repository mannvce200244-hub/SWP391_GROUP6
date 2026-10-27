package com.m4n.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.Instant;

@Entity
@Table(name = "stock_documents")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class StockDocument {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;
    @Column(name = "product_code", nullable = false, length = 50)
    private String productCode;
    @Column(name = "product_name", nullable = false, length = 200)
    private String productName;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20)
    private StockDocumentType type;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20)
    private StockDocumentStatus status;
    @Column(nullable = false)
    private Integer quantity;
    @Column(nullable = false, length = 500)
    private String reason;
    @Column(name = "created_by", nullable = false, length = 255)
    private String createdBy;
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
    @Column(name = "confirmed_by", length = 255)
    private String confirmedBy;
    @Column(name = "confirmed_at")
    private Instant confirmedAt;
    @Column(name = "accepted_quantity")
    private Integer acceptedQuantity;
    @Column(name = "rejected_quantity")
    private Integer rejectedQuantity;
    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;
    @Column(name = "quantity_before")
    private Integer quantityBefore;
    @Column(name = "quantity_after")
    private Integer quantityAfter;
    @PrePersist
    void onCreate() { if (createdAt == null) createdAt = Instant.now(); }
}
