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

    Optional<Product> findByIdAndIsActiveTrue(Long id);

    Optional<Product> findByCodeIgnoreCase(String code);

    Optional<Product> findByBarcodeIgnoreCase(String barcode);

    @Query("SELECT p FROM Product p WHERE p.isActive = true AND " +
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
