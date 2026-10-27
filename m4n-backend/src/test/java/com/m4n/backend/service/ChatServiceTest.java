package com.m4n.backend.service;

import com.m4n.backend.dto.request.ChatMessageRequest;
import com.m4n.backend.dto.request.StaffConversationScope;
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
import com.m4n.backend.service.serviceImpl.ChatServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.AccessDeniedException;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
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
    private User onlineStaff2;
    private User posStaff;
    private Conversation conversation;

    @BeforeEach
    void setUp() {
        chatService = new ChatServiceImpl(
                conversationRepository,
                chatMessageRepository,
                userRepository,
                notificationService
        );

        customer1 = user(1L, "customer1@m4n.vn", "Customer One", RoleName.CUSTOMER);
        customer2 = user(2L, "customer2@m4n.vn", "Customer Two", RoleName.CUSTOMER);
        onlineStaff = user(3L, "staff@m4n.vn", "Online Staff", RoleName.ONLINE_STAFF);
        onlineStaff2 = user(4L, "staff2@m4n.vn", "Online Staff Two", RoleName.ONLINE_STAFF);
        posStaff = user(5L, "pos@m4n.vn", "POS Staff", RoleName.POS_STAFF);

        conversation = Conversation.builder()
                .id(100L)
                .customer(customer1)
                .status(ConversationStatus.OPEN)
                .createdAt(Instant.parse("2026-09-20T08:00:00Z"))
                .updatedAt(Instant.parse("2026-09-20T08:00:00Z"))
                .build();
    }

    @Test
    @DisplayName("Customer get-or-create locks the customer row and reuses the single open conversation")
    void getOrCreate_reusesOpenConversationUnderCustomerLock() {
        when(userRepository.findByEmailIgnoreCaseWithLock("customer1@m4n.vn")).thenReturn(Optional.of(customer1));
        when(conversationRepository.findFirstByCustomerIdAndStatusOrderByCreatedAtDesc(1L, ConversationStatus.OPEN))
                .thenReturn(Optional.of(conversation));

        ConversationResponse response = chatService.startMyCustomerConversation("CUSTOMER1@m4n.vn");

        assertThat(response.id()).isEqualTo(100L);
        verify(userRepository).findByEmailIgnoreCaseWithLock("customer1@m4n.vn");
        verify(conversationRepository, never()).save(any(Conversation.class));
    }

    @Test
    @DisplayName("Customer get-or-create creates one unassigned open conversation when none exists")
    void getOrCreate_createsUnassignedOpenConversation() {
        when(userRepository.findByEmailIgnoreCaseWithLock("customer1@m4n.vn")).thenReturn(Optional.of(customer1));
        when(conversationRepository.findFirstByCustomerIdAndStatusOrderByCreatedAtDesc(1L, ConversationStatus.OPEN))
                .thenReturn(Optional.empty());
        when(conversationRepository.save(any(Conversation.class))).thenAnswer(invocation -> {
            Conversation saved = invocation.getArgument(0);
            saved.setId(101L);
            saved.setCreatedAt(Instant.now());
            saved.setUpdatedAt(saved.getCreatedAt());
            return saved;
        });

        ConversationResponse response = chatService.startMyCustomerConversation("customer1@m4n.vn");

        assertThat(response.id()).isEqualTo(101L);
        assertThat(response.status()).isEqualTo(ConversationStatus.OPEN);
        assertThat(response.assignedStaffId()).isNull();
    }

    @Test
    @DisplayName("Viewing chat after closure returns the latest closed transcript without silently creating a new session")
    void getMyConversation_returnsLatestClosedConversation() {
        conversation.setStatus(ConversationStatus.CLOSED);
        conversation.setClosedAt(Instant.parse("2026-09-20T10:00:00Z"));
        when(userRepository.findByEmailIgnoreCaseWithLock("customer1@m4n.vn")).thenReturn(Optional.of(customer1));
        when(conversationRepository.findFirstByCustomerIdAndStatusOrderByCreatedAtDesc(1L, ConversationStatus.OPEN))
                .thenReturn(Optional.empty());
        when(conversationRepository.findFirstByCustomerIdOrderByCreatedAtDesc(1L))
                .thenReturn(Optional.of(conversation));

        ConversationResponse response = chatService.getMyCustomerConversation("customer1@m4n.vn");

        assertThat(response.status()).isEqualTo(ConversationStatus.CLOSED);
        verify(conversationRepository, never()).save(any(Conversation.class));
    }

    @Test
    @DisplayName("Customer cannot read another customer's conversation")
    void getMessages_rejectsForeignCustomer() {
        mockUserLookup(customer2);
        when(conversationRepository.findByIdWithLock(100L)).thenReturn(Optional.of(conversation));

        assertThatThrownBy(() -> chatService.getMessages(100L, PageRequest.of(0, 100), customer2.getEmail()))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("khách hàng khác");
    }

    @Test
    @DisplayName("Unassigned or foreign online staff cannot read a conversation")
    void getMessages_rejectsStaffWhoDoesNotOwnConversation() {
        mockUserLookup(onlineStaff2);
        conversation.setAssignedStaff(onlineStaff);
        when(conversationRepository.findByIdWithLock(100L)).thenReturn(Optional.of(conversation));

        assertThatThrownBy(() -> chatService.getMessages(100L, PageRequest.of(0, 100), onlineStaff2.getEmail()))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("đang phụ trách");
    }

    @Test
    @DisplayName("Assigned online staff reads deterministic paged messages and marks incoming messages read")
    void getMessages_allowsAssignedStaff() {
        mockUserLookup(onlineStaff);
        conversation.setAssignedStaff(onlineStaff);
        when(conversationRepository.findByIdWithLock(100L)).thenReturn(Optional.of(conversation));
        when(chatMessageRepository.findByConversationIdOrderByCreatedAtDescIdDesc(eq(100L), any(PageRequest.class)))
                .thenReturn(Page.empty());

        Page<ChatMessageResponse> messages = chatService.getMessages(
                100L,
                PageRequest.of(0, 500),
                onlineStaff.getEmail()
        );

        assertThat(messages).isEmpty();
    }

    @Test
    @DisplayName("POS and admin roles are denied service-level chat access")
    void getMessages_rejectsNonChatRoles() {
        mockUserLookup(posStaff);
        when(conversationRepository.findByIdWithLock(100L)).thenReturn(Optional.of(conversation));

        assertThatThrownBy(() -> chatService.getMessages(100L, PageRequest.of(0, 20), posStaff.getEmail()))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("khách hàng và nhân viên trực tuyến");
    }

    @Test
    @DisplayName("Claim uses a database lock and assigns the authenticated online staff")
    void assignStaff_claimsOpenConversationUnderLock() {
        mockUserLookup(onlineStaff);
        when(conversationRepository.findByIdWithLock(100L)).thenReturn(Optional.of(conversation));
        when(conversationRepository.save(conversation)).thenReturn(conversation);

        ConversationResponse response = chatService.assignStaff(100L, onlineStaff.getEmail());

        assertThat(response.assignedStaffId()).isEqualTo(onlineStaff.getId());
        verify(conversationRepository).findByIdWithLock(100L);
    }

    @Test
    @DisplayName("A second staff member loses a claim race with a conflict")
    void assignStaff_rejectsSecondClaimant() {
        mockUserLookup(onlineStaff2);
        conversation.setAssignedStaff(onlineStaff);
        when(conversationRepository.findByIdWithLock(100L)).thenReturn(Optional.of(conversation));

        assertThatThrownBy(() -> chatService.assignStaff(100L, onlineStaff2.getEmail()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("nhân viên khác");
    }

    @Test
    @DisplayName("Closed conversations cannot be claimed")
    void assignStaff_rejectsClosedConversation() {
        mockUserLookup(onlineStaff);
        conversation.setStatus(ConversationStatus.CLOSED);
        when(conversationRepository.findByIdWithLock(100L)).thenReturn(Optional.of(conversation));

        assertThatThrownBy(() -> chatService.assignStaff(100L, onlineStaff.getEmail()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("đã đóng");
    }

    @Test
    @DisplayName("Only the assigned online staff can close a conversation")
    void closeConversation_rejectsForeignStaff() {
        mockUserLookup(onlineStaff2);
        conversation.setAssignedStaff(onlineStaff);
        when(conversationRepository.findByIdWithLock(100L)).thenReturn(Optional.of(conversation));

        assertThatThrownBy(() -> chatService.closeConversation(100L, onlineStaff2.getEmail()))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("đang phụ trách");
    }

    @Test
    @DisplayName("Assigned staff closes an open conversation and customer is notified")
    void closeConversation_closesAndNotifiesCustomer() {
        mockUserLookup(onlineStaff);
        conversation.setAssignedStaff(onlineStaff);
        when(conversationRepository.findByIdWithLock(100L)).thenReturn(Optional.of(conversation));
        when(conversationRepository.save(conversation)).thenReturn(conversation);

        ConversationResponse response = chatService.closeConversation(100L, onlineStaff.getEmail());

        assertThat(response.status()).isEqualTo(ConversationStatus.CLOSED);
        assertThat(response.closedAt()).isNotNull();
        verify(notificationService).createNotification(
                eq(customer1),
                eq("Phiên hỗ trợ đã kết thúc"),
                any(String.class),
                eq(NotificationType.CHAT),
                eq("/")
        );
    }

    @Test
    @DisplayName("A closed conversation cannot be closed twice")
    void closeConversation_rejectsSecondClose() {
        mockUserLookup(onlineStaff);
        conversation.setAssignedStaff(onlineStaff);
        conversation.setStatus(ConversationStatus.CLOSED);
        when(conversationRepository.findByIdWithLock(100L)).thenReturn(Optional.of(conversation));

        assertThatThrownBy(() -> chatService.closeConversation(100L, onlineStaff.getEmail()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("đóng trước đó");
    }

    @Test
    @DisplayName("Closed conversations reject all new messages")
    void sendMessage_rejectsClosedConversation() {
        mockUserLookup(customer1);
        conversation.setStatus(ConversationStatus.CLOSED);
        when(conversationRepository.findByIdWithLock(100L)).thenReturn(Optional.of(conversation));

        assertThatThrownBy(() -> chatService.sendMessage(
                100L,
                new ChatMessageRequest("Xin chào"),
                customer1.getEmail()
        )).isInstanceOf(IllegalStateException.class).hasMessageContaining("đã đóng");
    }

    @Test
    @DisplayName("Blank messages are rejected after ownership validation")
    void sendMessage_rejectsBlankText() {
        mockUserLookup(customer1);
        when(conversationRepository.findByIdWithLock(100L)).thenReturn(Optional.of(conversation));

        assertThatThrownBy(() -> chatService.sendMessage(
                100L,
                new ChatMessageRequest("   "),
                customer1.getEmail()
        )).isInstanceOf(IllegalArgumentException.class).hasMessageContaining("không được để trống");
    }

    @Test
    @DisplayName("Customer message updates activity and notifies only the assigned staff")
    void sendMessage_customerUpdatesActivityAndNotifiesAssignee() {
        mockUserLookup(customer1);
        conversation.setAssignedStaff(onlineStaff);
        when(conversationRepository.findByIdWithLock(100L)).thenReturn(Optional.of(conversation));
        when(chatMessageRepository.save(any(ChatMessage.class))).thenAnswer(invocation -> {
            ChatMessage message = invocation.getArgument(0);
            message.setId(500L);
            message.setCreatedAt(Instant.parse("2026-09-20T09:00:00Z"));
            return message;
        });

        ChatMessageResponse response = chatService.sendMessage(
                100L,
                new ChatMessageRequest("Em cần tư vấn về âm sắc Đàn Bầu"),
                customer1.getEmail()
        );

        assertThat(response.content()).isEqualTo("Em cần tư vấn về âm sắc Đàn Bầu");
        assertThat(conversation.getLastMessageAt()).isEqualTo(Instant.parse("2026-09-20T09:00:00Z"));
        verify(notificationService).createNotification(
                eq(onlineStaff),
                eq("Tin nhắn mới từ khách hàng"),
                any(String.class),
                eq(NotificationType.CHAT),
                eq("/staff/chat")
        );
    }

    @Test
    @DisplayName("Closed queue is scoped to the authenticated staff member")
    void getStaffConversations_usesOwnerScopedClosedQuery() {
        when(userRepository.findByEmailIgnoreCase(onlineStaff.getEmail())).thenReturn(Optional.of(onlineStaff));
        PageRequest pageable = PageRequest.of(0, 20);
        when(conversationRepository.findMyClosedQueue(onlineStaff.getId(), pageable))
                .thenReturn(new PageImpl<>(List.of()));

        Page<ConversationResponse> result = chatService.getStaffConversations(
                StaffConversationScope.CLOSED,
                pageable,
                onlineStaff.getEmail()
        );

        assertThat(result).isEmpty();
        verify(conversationRepository).findMyClosedQueue(onlineStaff.getId(), pageable);
    }

    private void mockUserLookup(User user) {
        when(userRepository.findByEmailIgnoreCaseWithLock(user.getEmail())).thenReturn(Optional.of(user));
    }

    private User user(Long id, String email, String fullName, RoleName roleName) {
        return User.builder()
                .id(id)
                .email(email)
                .fullName(fullName)
                .role(Role.builder().name(roleName).build())
                .isActive(true)
                .build();
    }
}
