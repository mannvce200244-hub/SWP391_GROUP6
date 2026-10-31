package com.m4n.backend.repository;

import com.m4n.backend.entity.ChatMessage;
import com.m4n.backend.entity.ConversationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    List<ChatMessage> findByConversationIdOrderByCreatedAtAscIdAsc(Long conversationId);

    Page<ChatMessage> findByConversationIdOrderByCreatedAtDescIdDesc(Long conversationId, Pageable pageable);

    Optional<ChatMessage> findFirstByConversationIdOrderByCreatedAtDescIdDesc(Long conversationId);

    long countByConversationIdAndSenderIdNotAndIsReadFalse(Long conversationId, Long readerId);

    @Query("SELECT COUNT(m) FROM ChatMessage m WHERE m.conversation.status = :status " +
            "AND m.conversation.assignedStaff.id = :staffId " +
            "AND m.sender.id <> :staffId AND m.isRead = false")
    long countUnreadAssignedToStaff(
            @Param("status") ConversationStatus status,
            @Param("staffId") Long staffId
    );
}
