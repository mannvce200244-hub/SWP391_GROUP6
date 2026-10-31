package com.m4n.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "pos_customers")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class PosCustomer {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "full_name", length = 150)
    private String fullName;

    @Column(nullable = false, unique = true, length = 10)
    private String phone;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
