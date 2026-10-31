package com.m4n.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "saved_delivery_addresses")
@Getter
@Setter
@NoArgsConstructor
public class SavedDeliveryAddress {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "user_id", nullable = false)
    private Long userId;
    @Column(nullable = false, length = 150)
    private String customerName;
    @Column(nullable = false, length = 10)
    private String customerPhone;
    @Column(nullable = false, length = 150)
    private String customerEmail;
    @Column(nullable = false, length = 300)
    private String shippingAddress;
    @Column(length = 500)
    private String notes;
    private Integer provinceId;
    private Integer wardId;
    @Column(length = 200)
    private String streetAddress;
    @Version
    private Long version;
}
