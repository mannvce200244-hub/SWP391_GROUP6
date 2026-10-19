package com.m4n.backend.serviceImpl;

import com.m4n.backend.dto.request.ChatMessageRequest;
import com.m4n.backend.dto.response.ChatMessageResponse;
import com.m4n.backend.dto.response.ConversationResponse;
import com.m4n.backend.entity.ChatMessage;
import com.m4n.backend.entity.Conversation;
import com.m4n.backend.entity.ConversationStatus;
import com.m4n.backend.entity.NotificationType;
import com.m4n.backend.entity.RoleName;
import com.m4n.backend.entity.User;
import com.m4n.backend.exception.ResourceNotFoundException;
import com.m4n.backend.repository.ChatMessageRepository;
import com.m4n.backend.repository.ConversationRepository;
import com.m4n.backend.repository.UserRepository;
import com.m4n.backend.service.ChatService;
import com.m4n.backend.service.NotificationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Slf4j
@Service
public class ChatServiceImpl implements ChatService {

    private final ConversationRepository conversationRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public ChatServiceImpl(
            ConversationRepository conversationRepository,
            ChatMessageRepository chatMessageRepository,
            UserRepository userRepository,
            NotificationService notificationService
    ) {
        this.conversationRepository = conversationRepository;
        this.chatMessageRepository = chatMessageRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    @Override
    @Transactional
    public ConversationResponse getOrCreateMyCustomerConversation(String customerEmail) {
        User customer = getUserByEmail(customerEmail);
        if (customer.getRole().getName() != RoleName.CUSTOMER) {
            throw new AccessDeniedException("Endpoint này chỉ dành cho khách hàng mở hội thoại hỗ trợ.");
        }

        Conversation conversation = conversationRepository
                .findFirstByCustomerIdAndStatusOrderByCreatedAtDesc(customer.getId(), ConversationStatus.OPEN)
                .orElseGet(() -> conversationRepository.save(
                        Conversation.builder()
                                .customer(customer)
                                .status(ConversationStatus.OPEN)
                                .build()
                ));

        return toConversationResponse(conversation, customer.getId());
    }

    @Override
    @Transactional
    public List<ChatMessageResponse> getMessages(Long conversationId, String userEmail) {
        User user = getUserByEmail(userEmail);
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found: " + conversationId));

        validateAccess(conversation, user);

        // Mark unread messages sent by the other party as read
        chatMessageRepository.markMessagesAsRead(conversation.getId(), user.getId());

        return chatMessageRepository.findByConversationIdOrderByCreatedAtAscIdAsc(conversationId)
                .stream()
                .map(this::toMessageResponse)
                .toList();
    }

    @Override
    @Transactional
    public ChatMessageResponse sendMessage(Long conversationId, ChatMessageRequest request, String senderEmail) {
        User sender = getUserByEmail(senderEmail);
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found: " + conversationId));

        validateAccess(conversation, sender);

        String text = request.content() != null ? request.content().trim() : "";
        if (text.isEmpty()) {
            throw new IllegalArgumentException("Nội dung tin nhắn không được để trống.");
        }

        ChatMessage message = ChatMessage.builder()
                .conversation(conversation)
                .sender(sender)
                .content(text)
                .isRead(false)
                .build();

        ChatMessage savedMessage = chatMessageRepository.save(message);

        // Update conversation timestamp
        conversation.setUpdatedAt(Instant.now());
        if (conversation.getAssignedStaff() == null && sender.getRole().getName() == RoleName.ONLINE_STAFF) {
            conversation.setAssignedStaff(sender);
        }
        conversationRepository.save(conversation);

        // Trigger in-app notification to the recipient
        if (sender.getRole().getName() == RoleName.CUSTOMER) {
            if (conversation.getAssignedStaff() != null) {
                notificationService.createNotification(
                        conversation.getAssignedStaff(),
                        "Tin nhắn mới từ khách hàng",
                        sender.getFullName() + ": " + (text.length() > 60 ? text.substring(0, 57) + "..." : text),
                        NotificationType.CHAT,
                        "/staff"
                );
            }
        } else {
            // Staff replied -> notify customer
            notificationService.createNotification(
                    conversation.getCustomer(),
                    "Phản hồi từ bộ phận hỗ trợ M4N",
                    "Nhân viên " + sender.getFullName() + " vừa trả lời tin nhắn của bạn.",
                    NotificationType.CHAT,
                    "/profile"
            );
        }

        return toMessageResponse(savedMessage);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ConversationResponse> getStaffConversations(Pageable pageable) {
        return conversationRepository.findAllByOrderByUpdatedAtDesc(pageable)
                .map(c -> toConversationResponse(c, null));
    }

    @Override
    @Transactional
    public ConversationResponse assignStaff(Long conversationId, String staffEmail) {
        User staff = getUserByEmail(staffEmail);
        if (staff.getRole().getName() != RoleName.ONLINE_STAFF) {
            throw new AccessDeniedException("Chỉ nhân viên trực tuyến mới có thể nhận hội thoại.");
        }

        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found: " + conversationId));

        conversation.setAssignedStaff(staff);
        Conversation updated = conversationRepository.save(conversation);
        return toConversationResponse(updated, staff.getId());
    }

    private void validateAccess(Conversation conversation, User user) {
        RoleName role = user.getRole().getName();
        if (role == RoleName.CUSTOMER) {
            if (!conversation.getCustomer().getId().equals(user.getId())) {
                throw new AccessDeniedException("Bạn không có quyền truy cập cuộc trò chuyện của khách hàng khác.");
            }
            return;
        }
        if (role != RoleName.ONLINE_STAFF) {
            throw new AccessDeniedException("Chỉ khách hàng và nhân viên trực tuyến được truy cập hội thoại hỗ trợ.");
        }
    }

    private User getUserByEmail(String email) {
        String normalizedEmail = email != null ? email.trim().toLowerCase() : "";
        return userRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + normalizedEmail));
    }

    private ChatMessageResponse toMessageResponse(ChatMessage message) {
        return new ChatMessageResponse(
                message.getId(),
                message.getConversation().getId(),
                message.getSender().getId(),
                message.getSender().getFullName(),
                message.getSender().getRole().getName(),
                message.getContent(),
                message.isRead(),
                message.getCreatedAt()
        );
    }

    private ConversationResponse toConversationResponse(Conversation conversation, Long currentUserId) {
        ChatMessage lastMessage = chatMessageRepository.findByConversationIdOrderByCreatedAtAscIdAsc(conversation.getId())
                .stream()
                .reduce((first, second) -> second)
                .orElse(null);

        long unreadCount = 0;
        if (currentUserId != null) {
            unreadCount = chatMessageRepository.countByConversationIdAndSenderIdNotAndIsReadFalse(conversation.getId(), currentUserId);
        }

        return new ConversationResponse(
                conversation.getId(),
                conversation.getCustomer().getId(),
                conversation.getCustomer().getFullName(),
                conversation.getCustomer().getEmail(),
                conversation.getAssignedStaff() != null ? conversation.getAssignedStaff().getId() : null,
                conversation.getAssignedStaff() != null ? conversation.getAssignedStaff().getFullName() : null,
                conversation.getStatus(),
                conversation.getCreatedAt(),
                conversation.getUpdatedAt(),
                unreadCount,
                lastMessage != null ? toMessageResponse(lastMessage) : null
        );
    }
}
