package com.m4n.backend.repository;

import com.m4n.backend.entity.StockDocument;
import com.m4n.backend.entity.StockDocumentStatus;
import com.m4n.backend.entity.StockDocumentType;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;

public interface StockDocumentRepository extends JpaRepository<StockDocument, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT d FROM StockDocument d WHERE d.id = :id")
    Optional<StockDocument> findByIdWithLock(@Param("id") Long id);

    @Query("SELECT d FROM StockDocument d WHERE (:productId IS NULL OR d.product.id = :productId) " +
            "AND (:type IS NULL OR d.type = :type) AND (:status IS NULL OR d.status = :status)")
    Page<StockDocument> search(@Param("productId") Long productId, @Param("type") StockDocumentType type,
            @Param("status") StockDocumentStatus status, Pageable pageable);
}
