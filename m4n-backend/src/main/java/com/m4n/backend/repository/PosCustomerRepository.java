package com.m4n.backend.repository;

import com.m4n.backend.entity.PosCustomer;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface PosCustomerRepository extends JpaRepository<PosCustomer, Long> {
    Optional<PosCustomer> findByPhone(String phone);

    List<PosCustomer> findByFullNameContainingIgnoreCaseOrPhoneContainingOrderByIdAsc(String name, String phone, Pageable pageable);

    // PostgreSQL upsert avoids aborting an invoice transaction when two cashiers create the same phone.
    @Modifying
    @Query(value = "INSERT INTO pos_customers (full_name, phone, created_at) VALUES (:name, :phone, CURRENT_TIMESTAMP) ON CONFLICT (phone) DO NOTHING", nativeQuery = true)
    int insertIfAbsent(@Param("name") String name, @Param("phone") String phone);
}
