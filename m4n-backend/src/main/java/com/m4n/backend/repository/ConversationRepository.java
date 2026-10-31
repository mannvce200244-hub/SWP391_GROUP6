package com.m4n.backend.repository;

import com.m4n.backend.entity.Conversation;
import com.m4n.backend.entity.ConversationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import jakarta.persistence.LockModeType;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, Long> {

    Optional<Conversation> findFirstByCustomerIdAndStatusOrderByCreatedAtDesc(Long customerId, ConversationStatus status);

    Optional<Conversation> findFirstByCustomerIdOrderByCreatedAtDesc(Long customerId);

    List<Conversation> findByCustomerIdOrderByUpdatedAtDesc(Long customerId);

    long countByStatusAndAssignedStaffIsNull(ConversationStatus status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT c FROM Conversation c WHERE c.id = :id")
    Optional<Conversation> findByIdWithLock(@Param("id") Long id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT c FROM Conversation c WHERE c.assignedStaff.id = :staffId " +
            "AND c.status = com.m4n.backend.entity.ConversationStatus.OPEN ORDER BY c.id")
    List<Conversation> findOpenAssignedToStaffWithLock(@Param("staffId") Long staffId);

    @EntityGraph(attributePaths = {"customer", "assignedStaff"})
    @Query(
            value = "SELECT c FROM Conversation c WHERE c.status = com.m4n.backend.entity.ConversationStatus.OPEN " +
                    "AND c.assignedStaff IS NULL ORDER BY COALESCE(c.lastMessageAt, c.createdAt) DESC, c.id DESC",
            countQuery = "SELECT COUNT(c) FROM Conversation c WHERE c.status = com.m4n.backend.entity.ConversationStatus.OPEN " +
                    "AND c.assignedStaff IS NULL"
    )
    Page<Conversation> findWaitingQueue(Pageable pageable);

    @EntityGraph(attributePaths = {"customer", "assignedStaff"})
    @Query(
            value = "SELECT c FROM Conversation c WHERE c.status = com.m4n.backend.entity.ConversationStatus.OPEN " +
                    "AND c.assignedStaff.id = :staffId ORDER BY COALESCE(c.lastMessageAt, c.createdAt) DESC, c.id DESC",
            countQuery = "SELECT COUNT(c) FROM Conversation c WHERE c.status = com.m4n.backend.entity.ConversationStatus.OPEN " +
                    "AND c.assignedStaff.id = :staffId"
    )
    Page<Conversation> findMyOpenQueue(@Param("staffId") Long staffId, Pageable pageable);

    @EntityGraph(attributePaths = {"customer", "assignedStaff"})
    @Query(
            value = "SELECT c FROM Conversation c WHERE c.status = com.m4n.backend.entity.ConversationStatus.CLOSED " +
                    "AND c.assignedStaff.id = :staffId ORDER BY c.closedAt DESC, c.id DESC",
            countQuery = "SELECT COUNT(c) FROM Conversation c WHERE c.status = com.m4n.backend.entity.ConversationStatus.CLOSED " +
                    "AND c.assignedStaff.id = :staffId"
    )
    Page<Conversation> findMyClosedQueue(@Param("staffId") Long staffId, Pageable pageable);
}
