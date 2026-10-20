package com.m4n.backend.dto.response;

import com.m4n.backend.entity.ConversationStatus;

import java.time.Instant;

public record ConversationResponse(
        Long id,
        Long customerId,
        String customerName,
        String customerEmail,
        Long assignedStaffId,
        String assignedStaffName,
        ConversationStatus status,
        Instant createdAt,
        Instant updatedAt,
        Instant lastMessageAt,
        Instant closedAt,
        long unreadCount,
        ChatMessageResponse lastMessage
) {}
