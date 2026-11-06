package com.m4n.backend.dto.response;

import com.m4n.backend.entity.NotificationType;

import java.time.Instant;

public record NotificationResponse(
        Long id,
        String title,
        String message,
        NotificationType type,
        String link,
        boolean isRead,
        Instant createdAt
) {}
