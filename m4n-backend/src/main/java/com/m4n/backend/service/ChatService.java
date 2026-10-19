package com.m4n.backend.service;

import com.m4n.backend.dto.request.ChatMessageRequest;
import com.m4n.backend.dto.response.ChatMessageResponse;
import com.m4n.backend.dto.response.ConversationResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface ChatService {

    ConversationResponse getOrCreateMyCustomerConversation(String customerEmail);

    List<ChatMessageResponse> getMessages(Long conversationId, String userEmail);

    ChatMessageResponse sendMessage(Long conversationId, ChatMessageRequest request, String senderEmail);

    Page<ConversationResponse> getStaffConversations(Pageable pageable);

    ConversationResponse assignStaff(Long conversationId, String staffEmail);
}
