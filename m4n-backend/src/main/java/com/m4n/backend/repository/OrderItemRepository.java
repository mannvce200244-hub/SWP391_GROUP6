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

    // Aggregate both channels before applying LIMIT; separate channel top-N lists
    // can omit a product that is the overall best seller.
    @Query("""
            SELECT new com.m4n.backend.dto.response.TopProductResponse(
                p.id, p.code, p.name, category.name, SUM(sales.quantity), SUM(sales.revenue))
            FROM Product p LEFT JOIN p.category category
            JOIN (
                SELECT oi.product.id AS productId, SUM(oi.quantity) AS quantity,
                       SUM(oi.price * oi.quantity) AS revenue
                FROM OrderItem oi WHERE oi.order.status = :status GROUP BY oi.product.id
                UNION ALL
                SELECT ii.product.id AS productId, SUM(ii.quantity) AS quantity,
                       SUM(ii.lineAmount) AS revenue
                FROM InvoiceItem ii GROUP BY ii.product.id
            ) sales ON sales.productId = p.id
            GROUP BY p.id, p.code, p.name, category.name
            ORDER BY SUM(sales.quantity) DESC, p.id ASC
            """)
    List<TopProductResponse> findTopSellingProductsAcrossChannels(@Param("status") OrderStatus status, Pageable pageable);
}
