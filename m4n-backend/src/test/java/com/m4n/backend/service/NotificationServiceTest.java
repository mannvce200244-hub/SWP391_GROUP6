package com.m4n.backend.service;

import com.m4n.backend.dto.response.NotificationResponse;
import com.m4n.backend.entity.Notification;
import com.m4n.backend.entity.NotificationType;
import com.m4n.backend.entity.Role;
import com.m4n.backend.entity.RoleName;
import com.m4n.backend.entity.User;
import com.m4n.backend.repository.NotificationRepository;
import com.m4n.backend.repository.UserRepository;
import com.m4n.backend.service.serviceImpl.NotificationServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private UserRepository userRepository;

    private NotificationService notificationService;

    private User userA;
    private User userB;
    private Notification notificationA;

    @BeforeEach
    void setUp() {
        notificationService = new NotificationServiceImpl(notificationRepository, userRepository);

        userA = User.builder()
                .id(1L)
                .email("usera@m4n.vn")
                .fullName("User A")
                .role(Role.builder().name(RoleName.CUSTOMER).build())
                .build();

        userB = User.builder()
                .id(2L)
                .email("userb@m4n.vn")
                .fullName("User B")
                .role(Role.builder().name(RoleName.CUSTOMER).build())
                .build();

        notificationA = Notification.builder()
                .id(10L)
                .user(userA)
                .title("Đơn hàng đã được xác nhận")
                .message("Đơn hàng #M4N-2026-001 của bạn đã được duyệt.")
                .type(NotificationType.ORDER)
                .isRead(false)
                .createdAt(Instant.now())
                .build();
    }

    @Test
    @DisplayName("User can get own recent notifications and unread count")
    void getRecentAndUnreadCount_success() {
        when(userRepository.findByEmailIgnoreCase("usera@m4n.vn")).thenReturn(Optional.of(userA));
        when(notificationRepository.findTop20ByUserIdOrderByCreatedAtDesc(1L)).thenReturn(List.of(notificationA));
        when(notificationRepository.countByUserIdAndIsReadFalse(1L)).thenReturn(1L);

        List<NotificationResponse> recent = notificationService.getRecentNotifications("usera@m4n.vn");
        long unreadCount = notificationService.getUnreadCount("usera@m4n.vn");

        assertThat(recent).hasSize(1);
        assertThat(recent.get(0).title()).isEqualTo("Đơn hàng đã được xác nhận");
        assertThat(unreadCount).isEqualTo(1L);
    }

    @Test
    @DisplayName("User can mark own notification as read")
    void markAsRead_ownNotification_success() {
        when(userRepository.findByEmailIgnoreCase("usera@m4n.vn")).thenReturn(Optional.of(userA));
        when(notificationRepository.findById(10L)).thenReturn(Optional.of(notificationA));

        notificationService.markAsRead(10L, "usera@m4n.vn");

        assertThat(notificationA.isRead()).isTrue();
        verify(notificationRepository).save(notificationA);
    }

    @Test
    @DisplayName("Foreign user attempting to mark notification as read is rejected (IDOR check)")
    void markAsRead_foreignUser_throwsAccessDenied() {
        when(userRepository.findByEmailIgnoreCase("userb@m4n.vn")).thenReturn(Optional.of(userB));
        when(notificationRepository.findById(10L)).thenReturn(Optional.of(notificationA)); // Owned by userA

        assertThatThrownBy(() -> notificationService.markAsRead(10L, "userb@m4n.vn"))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Bạn không có quyền truy cập thông báo này");
    }

    @Test
    @DisplayName("User can mark all notifications as read")
    void markAllAsRead_success() {
        when(userRepository.findByEmailIgnoreCase("usera@m4n.vn")).thenReturn(Optional.of(userA));

        notificationService.markAllAsRead("usera@m4n.vn");

        verify(notificationRepository).markAllAsReadByUserId(1L);
    }
}
