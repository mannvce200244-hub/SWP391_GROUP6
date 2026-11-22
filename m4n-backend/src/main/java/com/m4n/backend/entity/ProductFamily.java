package com.m4n.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "product_families")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ProductFamily {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, length = 200)
    private String name;
    @Column(name = "legacy_key", unique = true, length = 220)
    private String legacyKey;
    @Version
    @Column(nullable = false)
    private Long version;
    @Builder.Default
    @OneToMany(mappedBy = "family", fetch = FetchType.LAZY)
    @OrderBy("id ASC")
    private List<Product> variants = new ArrayList<>();
}
