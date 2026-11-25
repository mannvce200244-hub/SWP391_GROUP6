package com.m4n.backend.repository;

import com.m4n.backend.entity.Product;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {

    @EntityGraph(attributePaths = {"family", "category", "artisan", "craftVillage", "media"})
    Optional<Product> findWithDetailsByIdAndIsActiveTrue(Long id);

    @EntityGraph(attributePaths = {"family", "category", "artisan", "craftVillage", "media"})
    Optional<Product> findWithDetailsById(Long id);

    @Override
    @EntityGraph(attributePaths = {"family", "category", "artisan", "craftVillage"})
    Page<Product> findAll(org.springframework.data.jpa.domain.Specification<Product> spec, Pageable pageable);

    Optional<Product> findByIdAndIsActiveTrue(Long id);

    @Query("SELECT p.family.id FROM Product p WHERE p.id = :id")
    Optional<Long> findFamilyIdByProductId(@Param("id") Long id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Product p WHERE p.id = :id")
    Optional<Product> findByIdWithLock(@Param("id") Long id);

    Optional<Product> findByCodeIgnoreCase(String code);

    boolean existsByCodeIgnoreCase(String code);

    boolean existsByCodeIgnoreCaseAndIdNot(String code, Long id);

    boolean existsByVariantGroupIgnoreCaseAndVariantLabelIgnoreCaseAndIdNot(String group, String label, Long id);

    boolean existsByFamilyIdAndVariantLabelIgnoreCaseAndIdNot(Long familyId, String label, Long id);

    boolean existsByFamilyIdAndIsActiveTrue(Long familyId);

    long countByFamilyId(Long familyId);

    // A second-option transition must classify every existing SKU atomically.
    List<Product> findByFamilyIdOrderByIdAsc(Long familyId);

    boolean existsByFamilyIdAndOption2ValueIsNotNullAndIdNot(Long familyId, Long id);

    interface FamilyInventoryTotals {
        Long getFamilyId();
        Long getQuantity();
        Long getThreshold();
        Long getVariantCount();
        Long getActiveCount();
    }

    // Aggregate only the requested parent page; do not load lazy variant collections.
    @Query("SELECT p.family.id AS familyId, COALESCE(SUM(i.quantity), 0) AS quantity, "
            + "COALESCE(SUM(COALESCE(p.lowStockThreshold, 5)), 0) AS threshold, COUNT(p) AS variantCount, SUM(CASE WHEN p.isActive = true THEN 1 ELSE 0 END) AS activeCount "
            + "FROM Product p LEFT JOIN Inventory i ON i.product = p WHERE p.family.id IN :ids GROUP BY p.family.id")
    List<FamilyInventoryTotals> familyInventoryTotals(@Param("ids") List<Long> ids);

    @Query("SELECT p.family.id AS familyId, COALESCE(SUM(i.quantity), 0) AS quantity, "
            + "COALESCE(SUM(COALESCE(p.lowStockThreshold, 5)), 0) AS threshold, COUNT(p) AS variantCount, COUNT(p) AS activeCount "
            + "FROM Product p LEFT JOIN Inventory i ON i.product = p WHERE p.family.id IN :ids AND p.isActive = true GROUP BY p.family.id")
    List<FamilyInventoryTotals> activeFamilyInventoryTotals(@Param("ids") List<Long> ids);

    long countByCategoryId(Long categoryId);

    @Query("SELECT p.category.id, COUNT(DISTINCT p.family.id) + SUM(CASE WHEN p.family IS NULL THEN 1 ELSE 0 END) FROM Product p WHERE p.category.id IS NOT NULL GROUP BY p.category.id")
    List<Object[]> countProductsGroupedByCategoryId();

    long countByArtisanId(Long artisanId);

    @Query("SELECT p.artisan.id, COUNT(DISTINCT p.family.id) + SUM(CASE WHEN p.family IS NULL THEN 1 ELSE 0 END) FROM Product p WHERE p.artisan.id IS NOT NULL GROUP BY p.artisan.id")
    List<Object[]> countProductsGroupedByArtisanId();

    long countByCraftVillageId(Long craftVillageId);

    @Query("SELECT p.craftVillage.id, COUNT(DISTINCT p.family.id) + SUM(CASE WHEN p.family IS NULL THEN 1 ELSE 0 END) FROM Product p WHERE p.craftVillage.id IS NOT NULL GROUP BY p.craftVillage.id")
    List<Object[]> countProductsGroupedByCraftVillageId();

    Optional<Product> findByBarcodeIgnoreCase(String barcode);

    boolean existsByBarcodeIgnoreCase(String barcode);

    boolean existsByBarcodeIgnoreCaseAndIdNot(String barcode, Long id);

    @Query("SELECT p FROM Product p WHERE p.isActive    = true AND " +
            "(LOWER(p.code) = LOWER(:term) OR LOWER(p.barcode) = LOWER(:term))")
    Optional<Product> findByCodeOrBarcode(@Param("term") String term);

    @EntityGraph(attributePaths = {"family", "category", "artisan", "craftVillage", "media"})
    List<Product> findAllByIsActiveTrueOrderByCreatedAtDesc();
}
