package com.m4n.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "inventory_movements")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class InventoryMovement {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false, length = 20)
    private String type;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "quantity_before", nullable = false)
    private Integer quantityBefore;

    @Column(name = "quantity_after", nullable = false)
    private Integer quantityAfter;

    @Column(nullable = false, length = 500)
    private String reason;

    @Column(name = "actor_email", length = 255)
    private String actorEmail;

    @Column(name = "product_code", length = 50)
    private String productCode;
    @Column(name = "product_name", length = 200)
    private String productName;
    @Builder.Default
    @Column(name = "rejected_quantity")
    private Integer rejectedQuantity = 0;
    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;
    @Column(name = "source_type", length = 20)
    private String sourceType;
    @Column(name = "source_id")
    private Long sourceId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() { if (createdAt == null) createdAt = Instant.now(); }
}
