package com.m4n.backend.repository;

import com.m4n.backend.entity.InventoryMovement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface InventoryMovementRepository extends JpaRepository<InventoryMovement, Long> {
    @EntityGraph(attributePaths = "product")
    @Query("SELECT m FROM InventoryMovement m WHERE (:productId IS NULL OR m.product.id = :productId) " +
            "AND (:type IS NULL OR m.type = :type)")
    Page<InventoryMovement> search(@Param("productId") Long productId, @Param("type") String type, Pageable pageable);
}
