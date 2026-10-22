package com.m4n.backend.controller;

import com.m4n.backend.dto.request.ChatMessageRequest;
import com.m4n.backend.dto.request.StaffConversationScope;
import com.m4n.backend.dto.response.ChatMessageResponse;
import com.m4n.backend.dto.response.ConversationResponse;
import com.m4n.backend.service.ChatService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/chat")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Customer Support Chat", description = "Realtime customer support chat between customers and online staff")
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @GetMapping("/my-conversation")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Get current customer support conversation", description = "Returns the open conversation, latest closed conversation, or creates the customer's first conversation.")
    public ResponseEntity<ConversationResponse> getMyConversation(Authentication authentication) {
        ConversationResponse response = chatService.getMyCustomerConversation(authentication.getName());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/my-conversation")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Start a customer support conversation", description = "Creates a new open conversation after closure or reuses the customer's existing open conversation.")
    public ResponseEntity<ConversationResponse> startMyConversation(Authentication authentication) {
        ConversationResponse response = chatService.startMyCustomerConversation(authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/conversations/{id}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'ONLINE_STAFF')")
    @Operation(summary = "Get conversation state", description = "Returns conversation metadata after enforcing ownership or staff assignment.")
    public ResponseEntity<ConversationResponse> getConversation(
            @PathVariable Long id,
            Authentication authentication
    ) {
        return ResponseEntity.ok(chatService.getConversation(id, authentication.getName()));
    }

    @GetMapping("/conversations/{id}/messages")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'ONLINE_STAFF')")
    @Operation(summary = "Get messages for conversation", description = "Returns chronological message thread. Enforces customer conversation ownership.")
    public ResponseEntity<Page<ChatMessageResponse>> getMessages(
            @PathVariable Long id,
            @PageableDefault(size = 100) Pageable pageable,
            Authentication authentication
    ) {
        Page<ChatMessageResponse> messages = chatService.getMessages(id, pageable, authentication.getName());
        return ResponseEntity.ok(messages);
    }

    @PostMapping("/conversations/{id}/messages")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'ONLINE_STAFF')")
    @Operation(summary = "Send support message", description = "Appends message to thread. Sender derived securely from authentication context.")
    public ResponseEntity<ChatMessageResponse> sendMessage(
            @PathVariable Long id,
            @Valid @RequestBody ChatMessageRequest request,
            Authentication authentication
    ) {
        ChatMessageResponse message = chatService.sendMessage(id, request, authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(message);
    }

    @GetMapping("/staff/conversations")
    @PreAuthorize("hasRole('ONLINE_STAFF')")
    @Operation(summary = "List support queue for staff", description = "Returns conversations awaiting response. POS_STAFF is denied access.")
    public ResponseEntity<Page<ConversationResponse>> getStaffConversations(
            @RequestParam(defaultValue = "WAITING") StaffConversationScope scope,
            @PageableDefault(size = 20) Pageable pageable,
            Authentication authentication
    ) {
        Page<ConversationResponse> response = chatService.getStaffConversations(scope, pageable, authentication.getName());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/conversations/{id}/assign")
    @PreAuthorize("hasRole('ONLINE_STAFF')")
    @Operation(summary = "Assign staff to conversation", description = "Assigns authenticated staff member to the support conversation.")
    public ResponseEntity<ConversationResponse> assignStaff(
            @PathVariable Long id,
            Authentication authentication
    ) {
        ConversationResponse response = chatService.assignStaff(id, authentication.getName());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/conversations/{id}/close")
    @PreAuthorize("hasRole('ONLINE_STAFF')")
    @Operation(summary = "Close assigned conversation", description = "Closes an open conversation owned by the authenticated online staff member.")
    public ResponseEntity<ConversationResponse> closeConversation(
            @PathVariable Long id,
            Authentication authentication
    ) {
        return ResponseEntity.ok(chatService.closeConversation(id, authentication.getName()));
    }
}
