package com.m4n.backend.repository;

import com.m4n.backend.dto.response.TopProductResponse;
import com.m4n.backend.entity.OrderItem;
import com.m4n.backend.entity.OrderStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    @Query("SELECT new com.m4n.backend.dto.response.TopProductResponse(" +
            "oi.product.id, oi.productCode, oi.productName, oi.product.category.name, " +
            "SUM(oi.quantity), SUM(oi.price * oi.quantity)) " +
            "FROM OrderItem oi " +
            "WHERE oi.order.status = :status " +
            "GROUP BY oi.product.id, oi.productCode, oi.productName, oi.product.category.name " +
            "ORDER BY SUM(oi.quantity) DESC")
    List<TopProductResponse> findTopSellingProducts(@Param("status") OrderStatus status, Pageable pageable);
}
