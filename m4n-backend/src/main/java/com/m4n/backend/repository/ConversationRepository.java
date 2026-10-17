package com.m4n.backend.repository;

import com.m4n.backend.entity.Conversation;
import com.m4n.backend.entity.ConversationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, Long> {

    Optional<Conversation> findFirstByCustomerIdAndStatusOrderByCreatedAtDesc(Long customerId, ConversationStatus status);

    List<Conversation> findByCustomerIdOrderByUpdatedAtDesc(Long customerId);

    Page<Conversation> findByStatusOrderByUpdatedAtDesc(ConversationStatus status, Pageable pageable);

    Page<Conversation> findAllByOrderByUpdatedAtDesc(Pageable pageable);
}
