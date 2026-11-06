package com.m4n.backend.repository;

import com.m4n.backend.entity.Order;
import com.m4n.backend.entity.OrderStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    boolean existsByShippingVoucherCodeIgnoreCase(String code);

    /**
     * Pessimistic lock for state-transitioning operations (confirm/ship/deliver/cancel) so the
     * status check-then-act sequence is serialized against concurrent transitions on the
     * same order and cannot double-deduct or lose inventory restoration (BR-INVENTORY-01/03).
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT o FROM Order o WHERE o.id = :id")
    Optional<Order> findByIdWithLock(@Param("id") Long id);

    Page<Order> findByUserId(Long userId, Pageable pageable);

    Page<Order> findByUserIdAndStatus(Long userId, OrderStatus status, Pageable pageable);

    @Query("""
            SELECT o.id FROM Order o
            WHERE o.user.id = :userId AND o.status = :status
              AND EXISTS (SELECT oi.id FROM OrderItem oi WHERE oi.order = o AND oi.product.id = :productId)
              AND NOT EXISTS (SELECT r.id FROM Review r WHERE r.order = o AND r.product.id = :productId)
            ORDER BY o.createdAt DESC, o.id DESC
            """)
    List<Long> findUnreviewedPurchaseIds(@Param("userId") Long userId, @Param("productId") Long productId,
            @Param("status") OrderStatus status, Pageable pageable);

    Optional<Order> findByIdAndUserId(Long id, Long userId);

    Optional<Order> findByOrderCode(String orderCode);

    @Query("SELECT o FROM Order o WHERE " +
            "(:status IS NULL OR o.status = :status) AND " +
            "(:isPaid IS NULL OR o.isPaid = :isPaid) AND " +
            "(:paymentMethod IS NULL OR :paymentMethod = '' OR o.paymentMethod = :paymentMethod) AND " +
            "(:search IS NULL OR :search = '' OR " +
            "LOWER(o.orderCode) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(o.customerName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(o.customerPhone) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(o.customerEmail) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Order> searchOrders(
            @Param("status") OrderStatus status,
            @Param("isPaid") Boolean isPaid,
            @Param("paymentMethod") String paymentMethod,
            @Param("search") String search,
            Pageable pageable
    );

    long countByStatus(OrderStatus status);

    long countByCreatedAtGreaterThanEqualAndCreatedAtLessThan(Instant start, Instant end);

    long countByStatusAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(OrderStatus status, Instant start, Instant end);

    @Query("SELECT COALESCE(SUM(o.finalAmount), 0) FROM Order o WHERE o.status = :status")
    BigDecimal sumFinalAmountByStatus(@Param("status") OrderStatus status);

    @Query("SELECT COALESCE(SUM(o.finalAmount), 0) FROM Order o WHERE o.status = :status " +
            "AND COALESCE(o.completedAt, o.updatedAt, o.createdAt) >= :start " +
            "AND COALESCE(o.completedAt, o.updatedAt, o.createdAt) < :end")
    BigDecimal sumFinalAmountByStatusAndCompletedAtBetween(
            @Param("status") OrderStatus status,
            @Param("start") Instant start,
            @Param("end") Instant end
    );

    List<Order> findTop5ByOrderByCreatedAtDesc();

    boolean existsByVoucherCodeIgnoreCase(String voucherCode);

    boolean existsByAutomaticPromotionCodeIgnoreCase(String promotionCode);
}
