package com.m4n.backend.repository;

import com.m4n.backend.entity.ProductPromotion;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface ProductPromotionRepository extends JpaRepository<ProductPromotion, Long>, JpaSpecificationExecutor<ProductPromotion> {
    @Override @EntityGraph(attributePaths = "product")
    Page<ProductPromotion> findAll(Specification<ProductPromotion> spec, Pageable pageable);
    @Override @EntityGraph(attributePaths = "product")
    Optional<ProductPromotion> findById(Long id);

    // Optional period bounds and stable strongest-rate precedence are clearer together than a derived method name.
    @Query("SELECT p FROM ProductPromotion p WHERE p.product.id IN :productIds AND p.isActive = true AND p.discountRate > 0 "
            + "AND (p.validFrom IS NULL OR p.validFrom <= :now) AND (p.validUntil IS NULL OR p.validUntil > :now) "
            + "ORDER BY p.product.id ASC, p.discountRate DESC, p.id ASC")
    List<ProductPromotion> findApplicablePromotions(@Param("productIds") List<Long> productIds, @Param("now") Instant now);
}
