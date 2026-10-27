package com.m4n.backend.service.serviceImpl;

import com.m4n.backend.dto.response.NotificationResponse;
import com.m4n.backend.entity.Notification;
import com.m4n.backend.entity.NotificationType;
import com.m4n.backend.entity.User;
import com.m4n.backend.exception.ResourceNotFoundException;
import com.m4n.backend.repository.NotificationRepository;
import com.m4n.backend.repository.UserRepository;
import com.m4n.backend.service.NotificationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationServiceImpl(
            NotificationRepository notificationRepository,
            UserRepository userRepository
    ) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<NotificationResponse> getMyNotifications(String userEmail, Pageable pageable) {
        User user = getUserByEmail(userEmail);
        var allowed = java.util.Set.of("id", "createdAt");
        if (pageable.getSort().stream().anyMatch(order -> !allowed.contains(order.getProperty()))) {
            throw new IllegalArgumentException("Trường sắp xếp thông báo không hợp lệ.");
        }
        return notificationRepository.findByUserId(user.getId(), pageable)
                .map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<NotificationResponse> getRecentNotifications(String userEmail) {
        User user = getUserByEmail(userEmail);
        return notificationRepository.findTop20ByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public long getUnreadCount(String userEmail) {
        User user = getUserByEmail(userEmail);
        return notificationRepository.countByUserIdAndIsReadFalse(user.getId());
    }

    @Override
    @Transactional
    public void markAsRead(Long id, String userEmail) {
        User user = getUserByEmail(userEmail);
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with id: " + id));

        // Strict ownership check (IDOR protection)
        if (!notification.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("Bạn không có quyền truy cập thông báo này.");
        }

        if (!notification.isRead()) {
            notification.setRead(true);
            notificationRepository.save(notification);
        }
    }

    @Override
    @Transactional
    public void markAllAsRead(String userEmail) {
        User user = getUserByEmail(userEmail);
        notificationRepository.markAllAsReadByUserId(user.getId());
    }

    @Override
    @Transactional
    public void createNotification(User recipient, String title, String message, NotificationType type, String link) {
        if (recipient == null) {
            return;
        }

        Notification notification = Notification.builder()
                .user(recipient)
                .title(title)
                .message(message)
                .type(type != null ? type : NotificationType.SYSTEM)
                .link(link)
                .isRead(false)
                .build();

        notificationRepository.save(notification);
        log.debug("Created in-app notification for user {}: {}", recipient.getEmail(), title);
    }

    private User getUserByEmail(String email) {
        String normalizedEmail = email != null ? email.trim().toLowerCase() : "";
        return userRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + normalizedEmail));
    }

    private NotificationResponse toResponse(Notification notification) {
        return new NotificationResponse(
                notification.getId(),
                notification.getTitle(),
                notification.getMessage(),
                notification.getType(),
                notification.getLink(),
                notification.isRead(),
                notification.getCreatedAt()
        );
    }
}
