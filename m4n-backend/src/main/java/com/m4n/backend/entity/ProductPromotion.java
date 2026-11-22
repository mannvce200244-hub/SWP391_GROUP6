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
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private Product product;
    @Builder.Default
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "product_promotion_targets", joinColumns = @JoinColumn(name = "promotion_id"),
            inverseJoinColumns = @JoinColumn(name = "family_id"))
    @org.hibernate.annotations.BatchSize(size = 100)
    private java.util.Set<ProductFamily> families = new java.util.LinkedHashSet<>();
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
