package com.m4n.backend.service;

import com.m4n.backend.dto.request.ChatMessageRequest;
import com.m4n.backend.dto.response.ChatMessageResponse;
import com.m4n.backend.dto.response.ConversationResponse;
import com.m4n.backend.entity.ChatMessage;
import com.m4n.backend.entity.Conversation;
import com.m4n.backend.entity.ConversationStatus;
import com.m4n.backend.entity.NotificationType;
import com.m4n.backend.entity.Role;
import com.m4n.backend.entity.RoleName;
import com.m4n.backend.entity.User;
import com.m4n.backend.repository.ChatMessageRepository;
import com.m4n.backend.repository.ConversationRepository;
import com.m4n.backend.repository.UserRepository;
import com.m4n.backend.serviceImpl.ChatServiceImpl;
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
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ChatServiceTest {

    @Mock
    private ConversationRepository conversationRepository;

    @Mock
    private ChatMessageRepository chatMessageRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private NotificationService notificationService;

    private ChatService chatService;

    private User customer1;
    private User customer2;
    private User onlineStaff;
    private User posStaff;
    private Conversation conversation1;

    @BeforeEach
    void setUp() {
        chatService = new ChatServiceImpl(
                conversationRepository,
                chatMessageRepository,
                userRepository,
                notificationService
        );

        customer1 = User.builder()
                .id(1L)
                .email("customer1@m4n.vn")
                .fullName("Customer One")
                .role(Role.builder().name(RoleName.CUSTOMER).build())
                .isActive(true)
                .build();

        customer2 = User.builder()
                .id(2L)
                .email("customer2@m4n.vn")
                .fullName("Customer Two")
                .role(Role.builder().name(RoleName.CUSTOMER).build())
                .isActive(true)
                .build();

        onlineStaff = User.builder()
                .id(3L)
                .email("staff@m4n.vn")
                .fullName("Online Staff")
                .role(Role.builder().name(RoleName.ONLINE_STAFF).build())
                .isActive(true)
                .build();

        posStaff = User.builder()
                .id(4L)
                .email("pos@m4n.vn")
                .fullName("POS Staff")
                .role(Role.builder().name(RoleName.POS_STAFF).build())
                .isActive(true)
                .build();

        conversation1 = Conversation.builder()
                .id(100L)
                .customer(customer1)
                .status(ConversationStatus.OPEN)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
    }

    @Test
    @DisplayName("Customer can get or create own support conversation")
    void getOrCreateMyCustomerConversation_success() {
        when(userRepository.findByEmailIgnoreCase("customer1@m4n.vn")).thenReturn(Optional.of(customer1));
        when(conversationRepository.findFirstByCustomerIdAndStatusOrderByCreatedAtDesc(1L, ConversationStatus.OPEN))
                .thenReturn(Optional.of(conversation1));
        when(chatMessageRepository.findByConversationIdOrderByCreatedAtAscIdAsc(100L)).thenReturn(List.of());

        ConversationResponse response = chatService.getOrCreateMyCustomerConversation("customer1@m4n.vn");

        assertThat(response).isNotNull();
        assertThat(response.id()).isEqualTo(100L);
        assertThat(response.customerId()).isEqualTo(1L);
    }

    @Test
    @DisplayName("Customer attempting to access another customer's conversation is rejected (IDOR check)")
    void getMessages_foreignCustomer_throwsAccessDenied() {
        when(userRepository.findByEmailIgnoreCase("customer2@m4n.vn")).thenReturn(Optional.of(customer2));
        when(conversationRepository.findById(100L)).thenReturn(Optional.of(conversation1)); // Owned by customer1

        assertThatThrownBy(() -> chatService.getMessages(100L, "customer2@m4n.vn"))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Bạn không có quyền truy cập cuộc trò chuyện của khách hàng khác");
    }

    @Test
    @DisplayName("POS Staff cannot access customer support chat queue")
    void getMessages_posStaff_throwsAccessDenied() {
        when(userRepository.findByEmailIgnoreCase("pos@m4n.vn")).thenReturn(Optional.of(posStaff));
        when(conversationRepository.findById(100L)).thenReturn(Optional.of(conversation1));

        assertThatThrownBy(() -> chatService.getMessages(100L, "pos@m4n.vn"))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Chỉ khách hàng và nhân viên trực tuyến");
    }

    @Test
    @DisplayName("Admin cannot read a customer support conversation")
    void getMessages_admin_throwsAccessDenied() {
        User admin = User.builder()
                .id(5L)
                .email("admin@m4n.vn")
                .role(Role.builder().name(RoleName.ADMIN).build())
                .isActive(true)
                .build();
        when(userRepository.findByEmailIgnoreCase("admin@m4n.vn"))
                .thenReturn(Optional.of(admin));
        when(conversationRepository.findById(100L)).thenReturn(Optional.of(conversation1));

        assertThatThrownBy(() -> chatService.getMessages(100L, "admin@m4n.vn"))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Chỉ khách hàng và nhân viên trực tuyến");
    }

    @Test
    @DisplayName("Online Staff can access conversation thread and mark messages as read")
    void getMessages_onlineStaff_success() {
        when(userRepository.findByEmailIgnoreCase("staff@m4n.vn")).thenReturn(Optional.of(onlineStaff));
        when(conversationRepository.findById(100L)).thenReturn(Optional.of(conversation1));
        when(chatMessageRepository.findByConversationIdOrderByCreatedAtAscIdAsc(100L)).thenReturn(List.of());

        List<ChatMessageResponse> messages = chatService.getMessages(100L, "staff@m4n.vn");

        assertThat(messages).isNotNull();
        verify(chatMessageRepository).markMessagesAsRead(100L, 3L);
    }

    @Test
    @DisplayName("Customer sending message emits notification to assigned staff")
    void sendMessage_customer_emitsNotification() {
        conversation1.setAssignedStaff(onlineStaff);
        when(userRepository.findByEmailIgnoreCase("customer1@m4n.vn")).thenReturn(Optional.of(customer1));
        when(conversationRepository.findById(100L)).thenReturn(Optional.of(conversation1));
        when(chatMessageRepository.save(any(ChatMessage.class))).thenAnswer(inv -> {
            ChatMessage m = inv.getArgument(0);
            m.setId(500L);
            return m;
        });

        ChatMessageRequest request = new ChatMessageRequest("Em cần tư vấn về âm sắc Đàn Bầu");
        ChatMessageResponse response = chatService.sendMessage(100L, request, "customer1@m4n.vn");

        assertThat(response).isNotNull();
        assertThat(response.content()).isEqualTo("Em cần tư vấn về âm sắc Đàn Bầu");
        verify(notificationService).createNotification(
                eq(onlineStaff),
                eq("Tin nhắn mới từ khách hàng"),
                any(String.class),
                eq(NotificationType.CHAT),
                eq("/staff")
        );
    }
}
