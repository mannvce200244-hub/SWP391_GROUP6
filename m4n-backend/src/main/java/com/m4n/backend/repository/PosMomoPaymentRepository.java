package com.m4n.backend.repository;

import com.m4n.backend.entity.PosMomoPayment;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.*;
import java.util.Optional;

public interface PosMomoPaymentRepository extends JpaRepository<PosMomoPayment, String> {
    // Serializes callbacks, reconciliation, invoice settlement and refund allocation on one intent.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from PosMomoPayment p where p.id = :id")
    Optional<PosMomoPayment> findByIdWithLock(String id);
    org.springframework.data.domain.Page<PosMomoPayment> findByStaffIdAndInvoiceIsNullOrderByCreatedAtDesc(
            Long staffId, org.springframework.data.domain.Pageable pageable);

    // A bounded durable delivery queue; the attempt timestamp also leases concurrent workers.
    @Query("""
        select p.id from PosMomoPayment p
        where p.receiptEmailQueuedAt is not null and p.receiptEmailSentAt is null
          and p.invoice is not null
          and (p.receiptEmailAttemptedAt is null or p.receiptEmailAttemptedAt < :retryBefore)
        order by p.receiptEmailQueuedAt, p.id
        """)
    java.util.List<String> findPendingReceiptEmails(java.time.Instant retryBefore,
            org.springframework.data.domain.Pageable pageable);
}
