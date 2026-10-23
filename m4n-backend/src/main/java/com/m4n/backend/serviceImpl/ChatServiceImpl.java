package com.m4n.backend.serviceImpl;

import com.m4n.backend.dto.request.ChatMessageRequest;
import com.m4n.backend.dto.request.StaffConversationScope;
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
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

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
    public ConversationResponse getMyCustomerConversation(String customerEmail) {
        User customer = getLockedCustomer(customerEmail);
        Conversation conversation = conversationRepository
                .findFirstByCustomerIdAndStatusOrderByCreatedAtDesc(customer.getId(), ConversationStatus.OPEN)
                .or(() -> conversationRepository.findFirstByCustomerIdOrderByCreatedAtDesc(customer.getId()))
                .orElseGet(() -> createOpenConversation(customer));
        return toConversationResponse(conversation, customer.getId(), true);
    }

    @Override
    @Transactional
    public ConversationResponse startMyCustomerConversation(String customerEmail) {
        User customer = getLockedCustomer(customerEmail);
        Conversation conversation = conversationRepository
                .findFirstByCustomerIdAndStatusOrderByCreatedAtDesc(customer.getId(), ConversationStatus.OPEN)
                .orElseGet(() -> createOpenConversation(customer));
        return toConversationResponse(conversation, customer.getId(), true);
    }

    @Override
    @Transactional
    public ConversationResponse getConversation(Long conversationId, String userEmail) {
        User user = getUserByEmail(userEmail);
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found: " + conversationId));

        validateReadAccess(conversation, user);
        return toConversationResponse(conversation, user.getId(), true);
    }

    @Override
    @Transactional
    public Page<ChatMessageResponse> getMessages(Long conversationId, Pageable pageable, String userEmail) {
        User user = getUserByEmail(userEmail);
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found: " + conversationId));

        validateReadAccess(conversation, user);

        chatMessageRepository.markMessagesAsRead(conversation.getId(), user.getId());

        Pageable boundedPageable = PageRequest.of(
                Math.max(pageable.getPageNumber(), 0),
                Math.min(Math.max(pageable.getPageSize(), 1), 200)
        );
        return chatMessageRepository.findByConversationIdOrderByCreatedAtAscIdAsc(conversationId, boundedPageable)
                .map(this::toMessageResponse);
    }

    @Override
    @Transactional
    public ChatMessageResponse sendMessage(Long conversationId, ChatMessageRequest request, String senderEmail) {
        User sender = getUserByEmail(senderEmail);
        Conversation conversation = conversationRepository.findByIdWithLock(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found: " + conversationId));

        validateWriteAccess(conversation, sender);

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

        Instant messageTime = savedMessage.getCreatedAt() != null ? savedMessage.getCreatedAt() : Instant.now();
        conversation.setLastMessageAt(messageTime);
        conversation.setUpdatedAt(messageTime);
        conversationRepository.save(conversation);

        // Trigger in-app notification to the recipient
        if (sender.getRole().getName() == RoleName.CUSTOMER) {
            if (conversation.getAssignedStaff() != null) {
                notificationService.createNotification(
                        conversation.getAssignedStaff(),
                        "Tin nhắn mới từ khách hàng",
                        sender.getFullName() + ": " + (text.length() > 60 ? text.substring(0, 57) + "..." : text),
                        NotificationType.CHAT,
                        "/staff/chat"
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
    public Page<ConversationResponse> getStaffConversations(
            StaffConversationScope scope,
            Pageable pageable,
            String staffEmail
    ) {
        User staff = getUserByEmail(staffEmail);
        assertOnlineStaff(staff);

        Page<Conversation> conversations = switch (scope) {
            case WAITING -> conversationRepository.findWaitingQueue(pageable);
            case MINE -> conversationRepository.findMyOpenQueue(staff.getId(), pageable);
            case CLOSED -> conversationRepository.findMyClosedQueue(staff.getId(), pageable);
        };
        return conversations.map(c -> toConversationResponse(c, staff.getId(), false));
    }

    @Override
    @Transactional
    public ConversationResponse assignStaff(Long conversationId, String staffEmail) {
        User staff = getUserByEmail(staffEmail);
        assertOnlineStaff(staff);

        Conversation conversation = conversationRepository.findByIdWithLock(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found: " + conversationId));

        if (conversation.getStatus() != ConversationStatus.OPEN) {
            throw new IllegalStateException("Cuộc trò chuyện đã đóng và không thể tiếp nhận.");
        }
        if (conversation.getAssignedStaff() != null) {
            if (conversation.getAssignedStaff().getId().equals(staff.getId())) {
                return toConversationResponse(conversation, staff.getId(), true);
            }
            throw new IllegalStateException("Cuộc trò chuyện đã được một nhân viên khác tiếp nhận.");
        }

        conversation.setAssignedStaff(staff);
        Conversation updated = conversationRepository.save(conversation);
        return toConversationResponse(updated, staff.getId(), true);
    }

    @Override
    @Transactional
    public ConversationResponse closeConversation(Long conversationId, String staffEmail) {
        User staff = getUserByEmail(staffEmail);
        assertOnlineStaff(staff);

        Conversation conversation = conversationRepository.findByIdWithLock(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found: " + conversationId));
        if (conversation.getAssignedStaff() == null
                || !conversation.getAssignedStaff().getId().equals(staff.getId())) {
            throw new AccessDeniedException("Chỉ nhân viên đang phụ trách mới có thể đóng cuộc trò chuyện.");
        }
        if (conversation.getStatus() == ConversationStatus.CLOSED) {
            throw new IllegalStateException("Cuộc trò chuyện đã được đóng trước đó.");
        }

        Instant closedAt = Instant.now();
        conversation.setStatus(ConversationStatus.CLOSED);
        conversation.setClosedAt(closedAt);
        conversation.setUpdatedAt(closedAt);
        Conversation updated = conversationRepository.save(conversation);

        notificationService.createNotification(
                conversation.getCustomer(),
                "Phiên hỗ trợ đã kết thúc",
                "Nhân viên " + staff.getFullName() + " đã đóng phiên hỗ trợ. Bạn có thể bắt đầu phiên mới khi cần.",
                NotificationType.CHAT,
                "/"
        );

        return toConversationResponse(updated, staff.getId(), true);
    }

    private void validateReadAccess(Conversation conversation, User user) {
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
        if (conversation.getAssignedStaff() == null
                || !conversation.getAssignedStaff().getId().equals(user.getId())) {
            throw new AccessDeniedException("Bạn phải là nhân viên đang phụ trách để xem nội dung cuộc trò chuyện.");
        }
    }

    private void validateWriteAccess(Conversation conversation, User user) {
        validateReadAccess(conversation, user);
        if (conversation.getStatus() != ConversationStatus.OPEN) {
            throw new IllegalStateException("Cuộc trò chuyện đã đóng và không thể nhận thêm tin nhắn.");
        }
    }

    private void assertOnlineStaff(User user) {
        if (user.getRole().getName() != RoleName.ONLINE_STAFF) {
            throw new AccessDeniedException("Chỉ nhân viên trực tuyến mới có thể thao tác hàng đợi hỗ trợ.");
        }
    }

    private User getUserByEmail(String email) {
        String normalizedEmail = normalizeEmail(email);
        return userRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + normalizedEmail));
    }

    private User getLockedCustomer(String email) {
        String normalizedEmail = normalizeEmail(email);
        User customer = userRepository.findByEmailIgnoreCaseWithLock(normalizedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + normalizedEmail));
        if (customer.getRole().getName() != RoleName.CUSTOMER) {
            throw new AccessDeniedException("Endpoint này chỉ dành cho khách hàng mở hội thoại hỗ trợ.");
        }
        return customer;
    }

    private Conversation createOpenConversation(User customer) {
        return conversationRepository.save(
                Conversation.builder()
                        .customer(customer)
                        .status(ConversationStatus.OPEN)
                        .build()
        );
    }

    private String normalizeEmail(String email) {
        return email != null ? email.trim().toLowerCase() : "";
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

    private ConversationResponse toConversationResponse(
            Conversation conversation,
            Long currentUserId,
            boolean includeMessageDetails
    ) {
        ChatMessage lastMessage = includeMessageDetails
                ? chatMessageRepository.findFirstByConversationIdOrderByCreatedAtDescIdDesc(conversation.getId()).orElse(null)
                : null;

        long unreadCount = 0;
        if (includeMessageDetails && currentUserId != null) {
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
                conversation.getLastMessageAt(),
                conversation.getClosedAt(),
                unreadCount,
                lastMessage != null ? toMessageResponse(lastMessage) : null
        );
    }
}
