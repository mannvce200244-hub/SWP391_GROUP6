package com.m4n.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "shipping_settings")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ShippingSettings {
    @Id private Long id;
    @Column(nullable = false) private boolean enabled;
    @Column(name = "rate_per_kg", nullable = false, precision = 14, scale = 2)
    private BigDecimal ratePerKg;
    @Column(name = "free_shipping_enabled", nullable = false)
    private boolean freeShippingEnabled;
    @Column(name = "free_shipping_threshold", precision = 15, scale = 2)
    private BigDecimal freeShippingThreshold;
    @Version @Column(nullable = false) private Long version;
    @Column(name = "updated_at", nullable = false) private Instant updatedAt;
    @PreUpdate
    protected void onUpdate() { updatedAt = Instant.now(); }
}
