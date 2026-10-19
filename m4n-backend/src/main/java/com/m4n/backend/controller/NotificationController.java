package com.m4n.backend.controller;

import com.m4n.backend.dto.response.NotificationResponse;
import com.m4n.backend.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/notifications")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "In-App Notifications", description = "User-owned in-app notification inbox and read-state management")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    @Operation(summary = "Get user notifications", description = "Returns paginated list of notifications for the authenticated user.")
    public ResponseEntity<Page<NotificationResponse>> getMyNotifications(
            @PageableDefault(size = 15, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
            Authentication authentication
    ) {
        Page<NotificationResponse> response = notificationService.getMyNotifications(authentication.getName(), pageable);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/recent")
    @Operation(summary = "Get recent notifications", description = "Returns top recent notifications for header bell dropdown.")
    public ResponseEntity<List<NotificationResponse>> getRecentNotifications(Authentication authentication) {
        List<NotificationResponse> response = notificationService.getRecentNotifications(authentication.getName());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/unread-count")
    @Operation(summary = "Get unread notification count", description = "Returns count of unread notifications for notification badge.")
    public ResponseEntity<Map<String, Long>> getUnreadCount(Authentication authentication) {
        long count = notificationService.getUnreadCount(authentication.getName());
        return ResponseEntity.ok(Map.of("unreadCount", count));
    }

    @PostMapping("/{id}/read")
    @Operation(summary = "Mark notification as read", description = "Marks single notification as read. Enforces user ownership.")
    public ResponseEntity<Void> markAsRead(@PathVariable Long id, Authentication authentication) {
        notificationService.markAsRead(id, authentication.getName());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/read-all")
    @Operation(summary = "Mark all notifications as read", description = "Marks all unread notifications as read for the authenticated user.")
    public ResponseEntity<Void> markAllAsRead(Authentication authentication) {
        notificationService.markAllAsRead(authentication.getName());
        return ResponseEntity.noContent().build();
    }
}
