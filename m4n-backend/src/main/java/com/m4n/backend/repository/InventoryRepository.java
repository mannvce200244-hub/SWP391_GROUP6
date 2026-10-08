package com.m4n.backend.repository;

import com.m4n.backend.entity.Inventory;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface InventoryRepository extends JpaRepository<Inventory, Long> {
    Optional<Inventory> findByProductId(Long productId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT i FROM Inventory i WHERE i.product.id = :productId")
    Optional<Inventory> findByProductIdWithLock(@Param("productId") Long productId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT i FROM Inventory i WHERE i.product.id IN :productIds")
    List<Inventory> findByProductIdsWithLock(@Param("productIds") Collection<Long> productIds);

    long countByQuantityGreaterThan(Integer quantity);

    long countByQuantityBetween(Integer min, Integer max);

    long countByQuantity(Integer quantity);

    @Query("SELECT COALESCE(SUM(i.quantity), 0) FROM Inventory i")
    long sumTotalQuantity();
}

