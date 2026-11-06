package com.m4n.backend.repository;

import com.m4n.backend.entity.Inventory;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
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

    List<Inventory> findByProductIdIn(Collection<Long> productIds);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT i FROM Inventory i WHERE i.product.id = :productId")
    Optional<Inventory> findByProductIdWithLock(@Param("productId") Long productId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT i FROM Inventory i WHERE i.product.id IN :productIds")
    List<Inventory> findByProductIdsWithLock(@Param("productIds") Collection<Long> productIds);

    @Query("SELECT COUNT(i) FROM Inventory i WHERE i.quantity > COALESCE(i.product.lowStockThreshold, 5)")
    long countAvailableProducts();

    @Query("SELECT COUNT(i) FROM Inventory i WHERE i.quantity > 0 AND i.quantity <= COALESCE(i.product.lowStockThreshold, 5)")
    long countLowStockProducts();

    long countByQuantity(Integer quantity);

    @Query("SELECT COALESCE(SUM(i.quantity), 0) FROM Inventory i")
    long sumTotalQuantity();

    @EntityGraph(attributePaths = {"product", "product.category"})
    @Query("SELECT i FROM Inventory i WHERE " +
            "(:keyword IS NULL OR :keyword = '' OR " +
            "LOWER(i.product.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(i.product.code) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(i.product.barcode) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND " +
            "(:status IS NULL OR :status = '' OR " +
            "(:status = 'IN_STOCK' AND i.quantity > COALESCE(i.product.lowStockThreshold, 5)) OR " +
            "(:status = 'LOW_STOCK' AND i.quantity > 0 AND i.quantity <= COALESCE(i.product.lowStockThreshold, 5)) OR " +
            "(:status = 'OUT_OF_STOCK' AND i.quantity = 0))")
    Page<Inventory> searchInventories(
            @Param("keyword") String keyword,
            @Param("status") String status,
            Pageable pageable
    );
}
