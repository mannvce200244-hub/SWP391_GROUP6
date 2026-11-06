package com.m4n.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Locale;

/**
 * Voucher entity representing promotional discounts.
 * Follows BR-VOUCHER-01 for minimum order value and discount rate calculations.
 */
@Entity
@Table(name = "vouchers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Voucher {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @ColumnDefault("'MANUAL'")
    @Column(name = "promotion_type", nullable = false, length = 30)
    private PromotionType promotionType = PromotionType.MANUAL;

    @Column(name = "minimum_quantity")
    private Integer minimumQuantity;

    @Column(name = "discount_rate", nullable = false, precision = 6, scale = 4)
    private BigDecimal discountRate;
    @Column(name = "fixed_discount_amount", precision = 15, scale = 2)
    private BigDecimal fixedDiscountAmount;

    @Column(name = "minimum_order_value", nullable = false, precision = 15, scale = 2)
    private BigDecimal minimumOrderValue;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    @Column(length = 255)
    private String description;

    @Column(name = "valid_from")
    private Instant validFrom;

    @Column(name = "valid_until")
    private Instant validUntil;

    @Column(name = "usage_limit")
    private Integer usageLimit;

    @Builder.Default
    @Column(name = "used_count")
    private Integer usedCount = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
        this.updatedAt = this.createdAt;
        if (this.code != null) {
            this.code = this.code.trim().toUpperCase(Locale.ROOT);
        }
        if (this.usedCount == null) {
            this.usedCount = 0;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
        if (this.code != null) {
            this.code = this.code.trim().toUpperCase(Locale.ROOT);
        }
    }
}
