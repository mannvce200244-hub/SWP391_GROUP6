package com.m4n.backend.repository;

import com.m4n.backend.entity.Artisan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.domain.Sort;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.domain.Specification;

import java.util.Optional;
import java.util.List;

@Repository
public interface ArtisanRepository extends JpaRepository<Artisan, Long>, JpaSpecificationExecutor<Artisan> {
    @Override
    @EntityGraph(attributePaths = {"craftVillage"})
    Page<Artisan> findAll(Specification<Artisan> specification, Pageable pageable);
    @Override
    @EntityGraph(attributePaths = {"craftVillage"})
    List<Artisan> findAll(Sort sort);
    Optional<Artisan> findByNameIgnoreCase(String name);
    boolean existsByNameIgnoreCase(String name);
    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);
    long countByCraftVillageId(Long craftVillageId);

    @Query("SELECT a.craftVillage.id, COUNT(a) FROM Artisan a WHERE a.craftVillage.id IS NOT NULL GROUP BY a.craftVillage.id")
    List<Object[]> countArtisansGroupedByCraftVillageId();
}
