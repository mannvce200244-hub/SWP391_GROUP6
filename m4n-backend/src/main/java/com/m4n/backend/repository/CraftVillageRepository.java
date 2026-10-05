package com.m4n.backend.repository;

import com.m4n.backend.entity.CraftVillage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CraftVillageRepository extends JpaRepository<CraftVillage, Long> {
    Optional<CraftVillage> findByNameIgnoreCase(String name);
}
