package com.m4n.backend.repository;

import com.m4n.backend.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    Optional<Category> findByCodeIgnoreCase(String code);
    Optional<Category> findByNameIgnoreCase(String name);
}
