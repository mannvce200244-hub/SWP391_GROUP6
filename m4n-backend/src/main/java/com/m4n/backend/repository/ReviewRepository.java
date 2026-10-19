package com.m4n.backend.repository;

import com.m4n.backend.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    List<Review> findByProductIdOrderByCreatedAtDesc(Long productId);

    boolean existsByOrderIdAndProductId(Long orderId, Long productId);

    boolean existsByUserIdAndProductId(Long userId, Long productId);
}
