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

    /**
     * Pessimistic lock for state-transitioning operations (confirm/complete/cancel) so the
     * status check-then-act sequence is serialized against concurrent transitions on the
     * same order and cannot double-deduct or lose inventory restoration (BR-INVENTORY-01/03).
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT o FROM Order o WHERE o.id = :id")
    Optional<Order> findByIdWithLock(@Param("id") Long id);

    List<Order> findByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<Order> findByIdAndUserId(Long id, Long userId);

    Optional<Order> findByOrderCode(String orderCode);

    Page<Order> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<Order> findByStatusOrderByCreatedAtDesc(OrderStatus status, Pageable pageable);

    @Query("SELECT o FROM Order o WHERE " +
            "(:status IS NULL OR o.status = :status) AND " +
            "(:search IS NULL OR :search = '' OR " +
            "LOWER(o.orderCode) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(o.customerName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(o.customerPhone) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(o.customerEmail) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Order> searchOrders(
            @Param("status") OrderStatus status,
            @Param("search") String search,
            Pageable pageable
    );

    long countByStatus(OrderStatus status);

    long countByCreatedAtBetween(Instant start, Instant end);

    long countByStatusAndCreatedAtBetween(OrderStatus status, Instant start, Instant end);

    @Query("SELECT COALESCE(SUM(o.finalAmount), 0) FROM Order o WHERE o.status = :status")
    BigDecimal sumFinalAmountByStatus(@Param("status") OrderStatus status);

    @Query("SELECT COALESCE(SUM(o.finalAmount), 0) FROM Order o WHERE o.status = :status AND o.createdAt >= :start AND o.createdAt <= :end")
    BigDecimal sumFinalAmountByStatusAndCreatedAtBetween(
            @Param("status") OrderStatus status,
            @Param("start") Instant start,
            @Param("end") Instant end
    );

    List<Order> findTop5ByOrderByCreatedAtDesc();

    boolean existsByVoucherCodeIgnoreCase(String voucherCode);
}
