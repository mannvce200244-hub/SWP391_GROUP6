package com.m4n.backend.repository;

import com.m4n.backend.entity.ProductFamily;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ProductFamilyRepository extends JpaRepository<ProductFamily, Long> {
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    Optional<ProductFamily> findByLegacyKey(String key);

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("SELECT f FROM ProductFamily f WHERE f.id = :id")
    Optional<ProductFamily> findByIdWithLock(@org.springframework.data.repository.query.Param("id") Long id);
}
