package com.m4n.backend.repository;

import com.m4n.backend.dto.response.TopProductResponse;
import com.m4n.backend.entity.InvoiceItem;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InvoiceItemRepository extends JpaRepository<InvoiceItem, Long> {

    @Query("SELECT new com.m4n.backend.dto.response.TopProductResponse(" +
            "ii.product.id, ii.productCode, ii.productName, ii.product.category.name, " +
            "SUM(ii.quantity), SUM(ii.lineAmount)) " +
            "FROM InvoiceItem ii " +
            "GROUP BY ii.product.id, ii.productCode, ii.productName, ii.product.category.name " +
            "ORDER BY SUM(ii.quantity) DESC")
    List<TopProductResponse> findTopSellingProducts(Pageable pageable);
}
