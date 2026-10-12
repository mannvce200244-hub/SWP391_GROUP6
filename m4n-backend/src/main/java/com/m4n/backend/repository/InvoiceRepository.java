package com.m4n.backend.repository;

import com.m4n.backend.entity.Invoice;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    Optional<Invoice> findByInvoiceCode(String invoiceCode);

    @EntityGraph(attributePaths = {"items", "items.product", "staff"})
    @Query("SELECT inv FROM Invoice inv WHERE inv.id = :id")
    Optional<Invoice> findWithDetailsById(@Param("id") Long id);

    @EntityGraph(attributePaths = {"items", "items.product", "staff"})
    @Query("SELECT inv FROM Invoice inv WHERE inv.invoiceCode = :invoiceCode")
    Optional<Invoice> findWithDetailsByInvoiceCode(@Param("invoiceCode") String invoiceCode);

    @Query("SELECT COALESCE(SUM(inv.finalAmount), 0) FROM Invoice inv")
    BigDecimal sumFinalAmount();

    @Query("SELECT COALESCE(SUM(inv.finalAmount), 0) FROM Invoice inv WHERE inv.createdAt BETWEEN :start AND :end")
    BigDecimal sumFinalAmountByCreatedAtBetween(@Param("start") Instant start, @Param("end") Instant end);

    long countByCreatedAtBetween(Instant start, Instant end);

    Page<Invoice> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
