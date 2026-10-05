package com.m4n.backend.repository;

import com.m4n.backend.entity.Artisan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ArtisanRepository extends JpaRepository<Artisan, Long> {
    Optional<Artisan> findByNameIgnoreCase(String name);
}
