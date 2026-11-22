package com.m4n.backend.repository;

import com.m4n.backend.entity.ProductFamily;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ProductFamilyRepository extends JpaRepository<ProductFamily, Long> {
    Optional<ProductFamily> findByLegacyKey(String key);
}
