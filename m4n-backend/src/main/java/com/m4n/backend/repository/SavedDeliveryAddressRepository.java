package com.m4n.backend.repository;

import com.m4n.backend.entity.SavedDeliveryAddress;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface SavedDeliveryAddressRepository extends JpaRepository<SavedDeliveryAddress, Long> {
    Page<SavedDeliveryAddress> findByUserId(Long userId, Pageable pageable);
    Optional<SavedDeliveryAddress> findByIdAndUserId(Long id, Long userId);
}
