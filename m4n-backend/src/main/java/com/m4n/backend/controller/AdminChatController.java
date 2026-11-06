package com.m4n.backend.controller;

import com.m4n.backend.dto.response.ChatMessageResponse;
import com.m4n.backend.dto.response.ConversationResponse;
import com.m4n.backend.entity.ConversationStatus;
import com.m4n.backend.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/chat/conversations")
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
@RequiredArgsConstructor
public class AdminChatController {
    private final ChatService chatService;

    @GetMapping
    public Page<ConversationResponse> list(@RequestParam(defaultValue = "") String search,
            @RequestParam(required = false) ConversationStatus status,
            @PageableDefault(size = 20) Pageable pageable, Authentication authentication) {
        return chatService.getAdminConversations(search, status, pageable, authentication.getName());
    }

    @GetMapping("/{id}/messages")
    public Page<ChatMessageResponse> messages(@PathVariable Long id,
            @PageableDefault(size = 50) Pageable pageable, Authentication authentication) {
        return chatService.getAdminMessages(id, pageable, authentication.getName());
    }
}
