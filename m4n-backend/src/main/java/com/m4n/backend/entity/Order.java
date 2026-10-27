package com.m4n.backend.entity;

import jakarta.persistence.CascadeType;
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
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_code", nullable = false, unique = true, length = 64)
    private String orderCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "customer_name", nullable = false, length = 150)
    private String customerName;

    @Column(name = "customer_phone", nullable = false, length = 30)
    private String customerPhone;

    @Column(name = "customer_email", nullable = false, length = 150)
    private String customerEmail;

    @Column(name = "shipping_address", nullable = false, length = 300)
    private String shippingAddress;

    @Column(name = "total_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal totalAmount;

    @Builder.Default
    @Column(name = "discount_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "manual_discount_amount", precision = 15, scale = 2)
    private BigDecimal manualDiscountAmount = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "automatic_discount_amount", precision = 15, scale = 2)
    private BigDecimal automaticDiscountAmount = BigDecimal.ZERO;

    @Column(name = "automatic_promotion_code", length = 50)
    private String automaticPromotionCode;

    @Column(name = "final_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal finalAmount;

    @Column(name = "original_total_amount", precision = 15, scale = 2)
    private BigDecimal originalTotalAmount;
    @Builder.Default @Column(name = "product_discount_amount", precision = 15, scale = 2)
    private BigDecimal productDiscountAmount = BigDecimal.ZERO;
    @Builder.Default @Column(name = "base_shipping_fee", precision = 15, scale = 2)
    private BigDecimal baseShippingFee = BigDecimal.ZERO;
    @Builder.Default @Column(name = "shipping_discount_amount", precision = 15, scale = 2)
    private BigDecimal shippingDiscountAmount = BigDecimal.ZERO;
    @Builder.Default @Column(name = "shipping_fee", precision = 15, scale = 2)
    private BigDecimal shippingFee = BigDecimal.ZERO;
    @Column(name = "shipping_voucher_code", length = 50)
    private String shippingVoucherCode;
    @Builder.Default @Column(name = "free_shipping_applied")
    private Boolean freeShippingApplied = false;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private OrderStatus status;

    @Column(name = "payment_method", nullable = false, length = 60)
    private String paymentMethod;

    @Builder.Default
    @Column(name = "is_paid", nullable = false)
    private boolean isPaid = false;

    @Column(name = "voucher_code", length = 50)
    private String voucherCode;

    // Customer notes and subsequent fulfillment/cancellation events share this field.
    @Column(columnDefinition = "text")
    private String notes;

    @Builder.Default
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> items = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
        this.updatedAt = this.createdAt;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }
}
