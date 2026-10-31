package com.m4n.backend.repository;

import com.m4n.backend.entity.Voucher;
import com.m4n.backend.entity.PromotionType;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;

import java.util.Optional;

@Repository
public interface VoucherRepository extends JpaRepository<Voucher, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT v FROM Voucher v WHERE v.id = :id")
    Optional<Voucher> findByIdWithLock(@Param("id") Long id);

    String ELIGIBLE_AUTOMATIC_PROMOTIONS = """
            SELECT v FROM Voucher v
            WHERE v.promotionType = :type AND v.isActive = true
              AND (v.validFrom IS NULL OR v.validFrom <= :now)
              AND (v.validUntil IS NULL OR v.validUntil >= :now)
              AND v.minimumOrderValue <= :amount
              AND (v.minimumQuantity IS NULL OR v.minimumQuantity <= :quantity)
              AND COALESCE(v.usedCount, 0) < 2147483647
              AND (v.usageLimit IS NULL OR COALESCE(v.usedCount, 0) < v.usageLimit)
            ORDER BY ROUND(:amount * v.discountRate, 0) DESC, v.id ASC
            """;

    @Query(ELIGIBLE_AUTOMATIC_PROMOTIONS)
    List<Voucher> findEligibleAutomaticPromotions(@Param("type") PromotionType type,
            @Param("amount") BigDecimal amount, @Param("quantity") int quantity,
            @Param("now") Instant now, Pageable pageable);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query(ELIGIBLE_AUTOMATIC_PROMOTIONS)
    List<Voucher> findEligibleAutomaticPromotionsWithLock(@Param("type") PromotionType type,
            @Param("amount") BigDecimal amount, @Param("quantity") int quantity,
            @Param("now") Instant now, Pageable pageable);

    Optional<Voucher> findByCodeIgnoreCaseAndIsActiveTrue(String code);

    Optional<Voucher> findByCodeIgnoreCase(String code);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT v FROM Voucher v WHERE UPPER(v.code) = UPPER(:code)")
    Optional<Voucher> findByCodeIgnoreCaseWithLock(@Param("code") String code);

    boolean existsByCodeIgnoreCase(String code);

    @Query("""
            SELECT v FROM Voucher v WHERE
            (:search IS NULL OR LOWER(v.code) LIKE LOWER(CONCAT('%', :search, '%'))
                OR LOWER(v.description) LIKE LOWER(CONCAT('%', :search, '%')))
            AND (:type IS NULL OR v.promotionType = :type)
            AND (:isActive IS NULL OR v.isActive = :isActive)
            AND (:state IS NULL
                OR (:state = 'INACTIVE' AND v.isActive = false)
                OR (v.isActive = true AND (
                    (:state = 'UPCOMING' AND v.validFrom > :now)
                    OR ((v.validFrom IS NULL OR v.validFrom <= :now) AND (
                        (:state = 'EXPIRED' AND v.validUntil < :now)
                        OR ((v.validUntil IS NULL OR v.validUntil >= :now) AND (
                            (:state = 'EXHAUSTED' AND (COALESCE(v.usedCount, 0) >= 2147483647
                                OR (v.usageLimit IS NOT NULL AND COALESCE(v.usedCount, 0) >= v.usageLimit)))
                            OR (:state = 'ACTIVE' AND COALESCE(v.usedCount, 0) < 2147483647
                                AND (v.usageLimit IS NULL OR COALESCE(v.usedCount, 0) < v.usageLimit))
                        ))
                    ))
                )))
            """)
    Page<Voucher> search(@Param("search") String search, @Param("type") PromotionType type,
            @Param("isActive") Boolean isActive, @Param("state") String state, @Param("now") Instant now, Pageable pageable);
}
