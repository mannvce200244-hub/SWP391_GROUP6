package com.m4n.backend.service;

import com.m4n.backend.dto.request.ChatMessageRequest;
import com.m4n.backend.dto.request.StaffConversationScope;
import com.m4n.backend.dto.response.ChatMessageResponse;
import com.m4n.backend.dto.response.ConversationResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ChatService {

    ConversationResponse getMyCustomerConversation(String customerEmail);

    ConversationResponse startMyCustomerConversation(String customerEmail);

    ConversationResponse getConversation(Long conversationId, String userEmail);

    Page<ChatMessageResponse> getMessages(Long conversationId, Pageable pageable, String userEmail);

    ChatMessageResponse sendMessage(Long conversationId, ChatMessageRequest request, String senderEmail);

    Page<ConversationResponse> getStaffConversations(StaffConversationScope scope, Pageable pageable, String staffEmail);

    ConversationResponse assignStaff(Long conversationId, String staffEmail);

    ConversationResponse closeConversation(Long conversationId, String staffEmail);
}
