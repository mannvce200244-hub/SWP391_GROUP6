package com.m4n.backend.repository;

import com.m4n.backend.entity.ProductMedia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductMediaRepository extends JpaRepository<ProductMedia, Long> {
    List<ProductMedia> findByProductIdOrderBySortOrderAsc(Long productId);
}
