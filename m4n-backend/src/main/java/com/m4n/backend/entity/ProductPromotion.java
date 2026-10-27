package com.m4n.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "product_promotions", indexes = @Index(name = "idx_product_promotion_active", columnList = "product_id,is_active"))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ProductPromotion {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;
    @Column(nullable = false, length = 150)
    private String name;
    @Column(name = "discount_rate", nullable = false, precision = 6, scale = 4)
    private BigDecimal discountRate;
    @Column(name = "is_active", nullable = false)
    private boolean isActive;
    @Column(name = "valid_from")
    private Instant validFrom;
    @Column(name = "valid_until")
    private Instant validUntil;
    @Version @Column(nullable = false)
    private Long version;
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
    @PrePersist
    protected void onCreate() { createdAt = Instant.now(); updatedAt = createdAt; }
    @PreUpdate
    protected void onUpdate() { updatedAt = Instant.now(); }
}
