package com.m4n.backend.repository;

import com.m4n.backend.entity.Cart;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CartRepository extends JpaRepository<Cart, Long> {

    @EntityGraph(attributePaths = {"items", "items.product"})
    Optional<Cart> findWithItemsByUserId(Long userId);

    Optional<Cart> findByUserId(Long userId);
}
