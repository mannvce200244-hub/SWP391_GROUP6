package com.m4n.backend.repository;

import com.m4n.backend.entity.Article;
import com.m4n.backend.entity.ArticleStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

public interface ArticleRepository extends JpaRepository<Article, Long>, JpaSpecificationExecutor<Article> {
    @Override
    @EntityGraph(attributePaths = {"product", "artisan", "craftVillage"})
    Page<Article> findAll(Specification<Article> spec, Pageable pageable);

    @Override
    @EntityGraph(attributePaths = {"product", "artisan", "craftVillage"})
    Optional<Article> findById(Long id);

    @EntityGraph(attributePaths = {"product", "artisan", "craftVillage"})
    Optional<Article> findByIdAndStatus(Long id, ArticleStatus status);

    boolean existsByArtisanId(Long artisanId);
    boolean existsByCraftVillageId(Long craftVillageId);
}
