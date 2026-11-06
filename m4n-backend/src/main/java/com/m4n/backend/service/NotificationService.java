package com.m4n.backend.service;

import com.m4n.backend.dto.response.NotificationResponse;
import com.m4n.backend.entity.NotificationType;
import com.m4n.backend.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface NotificationService {

    Page<NotificationResponse> getMyNotifications(String userEmail, Pageable pageable);

    List<NotificationResponse> getRecentNotifications(String userEmail);

    long getUnreadCount(String userEmail);

    void markAsRead(Long id, String userEmail);

    void markAllAsRead(String userEmail);

    void createNotification(User recipient, String title, String message, NotificationType type, String link);
}
