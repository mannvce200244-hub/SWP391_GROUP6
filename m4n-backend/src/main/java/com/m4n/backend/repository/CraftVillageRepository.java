package com.m4n.backend.repository;

import com.m4n.backend.entity.CraftVillage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

import java.util.Optional;

@Repository
public interface CraftVillageRepository extends JpaRepository<CraftVillage, Long>, JpaSpecificationExecutor<CraftVillage> {
    @Query("SELECT DISTINCT v.location FROM CraftVillage v WHERE v.location IS NOT NULL AND TRIM(v.location) <> '' ORDER BY v.location")
    List<String> findDistinctLocations();
    Optional<CraftVillage> findByNameIgnoreCase(String name);
    boolean existsByNameIgnoreCase(String name);
    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);
}
