package com.m4n.backend.repository;

import com.m4n.backend.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {

    @EntityGraph(attributePaths = {"category", "artisan", "craftVillage", "media"})
    Optional<Product> findWithDetailsByIdAndIsActiveTrue(Long id);

    @EntityGraph(attributePaths = {"category", "artisan", "craftVillage", "media"})
    Optional<Product> findWithDetailsById(Long id);

    @Override
    @EntityGraph(attributePaths = {"category", "artisan", "craftVillage"})
    Page<Product> findAll(org.springframework.data.jpa.domain.Specification<Product> spec, Pageable pageable);

    Optional<Product> findByIdAndIsActiveTrue(Long id);

    Optional<Product> findByCodeIgnoreCase(String code);

    boolean existsByCodeIgnoreCase(String code);

    boolean existsByCodeIgnoreCaseAndIdNot(String code, Long id);

    long countByCategoryId(Long categoryId);

    @Query("SELECT p.category.id, COUNT(p) FROM Product p WHERE p.category.id IS NOT NULL GROUP BY p.category.id")
    List<Object[]> countProductsGroupedByCategoryId();

    long countByArtisanId(Long artisanId);

    long countByCraftVillageId(Long craftVillageId);

    Optional<Product> findByBarcodeIgnoreCase(String barcode);

    boolean existsByBarcodeIgnoreCase(String barcode);

    boolean existsByBarcodeIgnoreCaseAndIdNot(String barcode, Long id);

    @Query("SELECT p FROM Product p WHERE p.isActive    = true AND " +
            "(LOWER(p.code) = LOWER(:term) OR LOWER(p.barcode) = LOWER(:term))")
    Optional<Product> findByCodeOrBarcode(@Param("term") String term);

    @EntityGraph(attributePaths = {"category", "media"})
    @Query("SELECT p FROM Product p WHERE p.isActive = true AND " +
            "(:keyword IS NULL OR :keyword = '' OR " +
            "LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(p.code) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(p.barcode) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Product> searchPosProducts(@Param("keyword") String keyword, Pageable pageable);

    @EntityGraph(attributePaths = {"category", "artisan", "craftVillage", "media"})
    List<Product> findAllByIsActiveTrueOrderByCreatedAtDesc();
}
