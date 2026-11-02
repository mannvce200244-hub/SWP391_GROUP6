package com.m4n.backend.repository;

import com.m4n.backend.entity.PaymentAttempt;
import com.m4n.backend.entity.PaymentState;
import com.m4n.backend.entity.RefundState;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;

public interface PaymentAttemptRepository extends JpaRepository<PaymentAttempt, Long> {
    Optional<PaymentAttempt> findFirstByOrderIdOrderByIdDesc(Long orderId);
    Optional<PaymentAttempt> findFirstByOrderIdAndStateOrderByIdDesc(Long orderId, PaymentState state);
    Optional<PaymentAttempt> findByTransactionReference(String reference);
    @Query("SELECT p.order.id FROM PaymentAttempt p WHERE p.transactionReference = :reference")
    Optional<Long> findOrderIdByTransactionReference(@Param("reference") String reference);
    boolean existsByOrderIdAndRefundState(Long orderId, RefundState state);
    boolean existsByOrderIdAndState(Long orderId, PaymentState state);
}
