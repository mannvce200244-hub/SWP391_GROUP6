package com.m4n.backend.repository;

import com.m4n.backend.entity.Product;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {

    @EntityGraph(attributePaths = {"category", "artisan", "craftVillage", "media"})
    Optional<Product> findWithDetailsByIdAndIsActiveTrue(Long id);

    Optional<Product> findByIdAndIsActiveTrue(Long id);

    Optional<Product> findByCodeIgnoreCase(String code);

    @EntityGraph(attributePaths = {"category", "artisan", "craftVillage", "media"})
    List<Product> findAllByIsActiveTrueOrderByCreatedAtDesc();
}
