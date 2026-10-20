package com.m4n.backend.dto.response;

import com.m4n.backend.entity.RoleName;

import java.time.Instant;

public record ChatMessageResponse(
        Long id,
        Long conversationId,
        Long senderId,
        String senderName,
        RoleName senderRole,
        String content,
        boolean isRead,
        Instant createdAt
) {}
