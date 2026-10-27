package com.m4n.backend.service;

import com.m4n.backend.dto.request.ChatMessageRequest;
import com.m4n.backend.dto.request.ChangeUserRoleRequest;
import com.m4n.backend.dto.response.ChatMessageResponse;
import com.m4n.backend.dto.response.ConversationResponse;
import com.m4n.backend.entity.Conversation;
import com.m4n.backend.entity.ConversationStatus;
import com.m4n.backend.entity.RoleName;
import com.m4n.backend.entity.User;
import com.m4n.backend.repository.ChatMessageRepository;
import com.m4n.backend.repository.ConversationRepository;
import com.m4n.backend.repository.RoleRepository;
import com.m4n.backend.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
public class ChatConcurrencyIntegrationTest {

    @Autowired
    private ChatService chatService;

    @Autowired
    private ConversationRepository conversationRepository;

    @Autowired
    private ChatMessageRepository chatMessageRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private AdminUserService adminUserService;

    @Autowired
    private PlatformTransactionManager transactionManager;

    private final List<User> fixtureUsers = new ArrayList<>();
    private String customerEmail;
    private String customer2Email;
    private String staffAEmail;
    private String staffBEmail;
    private String posEmail;
    private String adminEmail;

    @BeforeEach
    void createIsolatedAccounts() {
        String suffix = UUID.randomUUID().toString();
        String encodedPassword = passwordEncoder.encode("Password123!");
        customerEmail = createFixtureUser("customer", suffix, RoleName.CUSTOMER, encodedPassword);
        customer2Email = createFixtureUser("customer2", suffix, RoleName.CUSTOMER, encodedPassword);
        staffAEmail = createFixtureUser("staff-a", suffix, RoleName.ONLINE_STAFF, encodedPassword);
        staffBEmail = createFixtureUser("staff-b", suffix, RoleName.ONLINE_STAFF, encodedPassword);
        posEmail = createFixtureUser("pos", suffix, RoleName.POS_STAFF, encodedPassword);
        adminEmail = createFixtureUser("admin", suffix, RoleName.ADMIN, encodedPassword);
    }

    @AfterEach
    void removeOnlyThisTestsFixtures() {
        for (User user : fixtureUsers) {
            jdbcTemplate.update("DELETE FROM notifications WHERE user_id = ?", user.getId());
            jdbcTemplate.update("""
                    DELETE FROM chat_messages WHERE sender_id = ? OR conversation_id IN (
                        SELECT id FROM conversations WHERE customer_id = ? OR assigned_staff_id = ?
                    )
                    """, user.getId(), user.getId(), user.getId());
        }
        for (User user : fixtureUsers) {
            jdbcTemplate.update("DELETE FROM conversations WHERE customer_id = ? OR assigned_staff_id = ?",
                    user.getId(), user.getId());
        }
        for (User user : fixtureUsers) {
            jdbcTemplate.update("DELETE FROM users WHERE id = ?", user.getId());
        }
    }

    private String createFixtureUser(String label, String suffix, RoleName role, String encodedPassword) {
        User user = userRepository.saveAndFlush(User.builder()
                .email("chat-" + label + "-" + suffix + "@m4n.test")
                .fullName("Chat regression " + label)
                .password(encodedPassword)
                .role(roleRepository.findByName(role).orElseThrow())
                .isActive(true).build());
        fixtureUsers.add(user);
        return user.getEmail();
    }

    @Test
    void disablingAssignedStaffReleasesOpenChatAndPreservesClosedHistory() {
        ConversationResponse closed = chatService.startMyCustomerConversation(customerEmail);
        chatService.assignStaff(closed.id(), staffAEmail);
        chatService.sendMessage(closed.id(), new ChatMessageRequest("Preserved closed transcript"), staffAEmail);
        chatService.closeConversation(closed.id(), staffAEmail);
        ConversationResponse open = chatService.startMyCustomerConversation(customerEmail);
        chatService.assignStaff(open.id(), staffAEmail);
        chatService.sendMessage(open.id(), new ChatMessageRequest("Preserved open transcript"), staffAEmail);
        User staff = userRepository.findByEmailIgnoreCase(staffAEmail).orElseThrow();

        adminUserService.disableUser(staff.getId(), staff.getVersion(), adminEmail);

        assertThat(conversationRepository.findById(open.id()).orElseThrow().getAssignedStaff()).isNull();
        Conversation history = conversationRepository.findById(closed.id()).orElseThrow();
        assertThat(history.getStatus()).isEqualTo(ConversationStatus.CLOSED);
        assertThat(history.getAssignedStaff().getId()).isEqualTo(staff.getId());
        assertThat(chatService.getMessages(closed.id(), PageRequest.of(0, 20), customerEmail).getContent())
                .extracting(ChatMessageResponse::content).containsExactly("Preserved closed transcript");
        assertThatThrownBy(() -> chatService.assignStaff(open.id(), staffAEmail))
                .isInstanceOf(AccessDeniedException.class);
        assertThatThrownBy(() -> chatService.sendMessage(open.id(), new ChatMessageRequest("Forbidden"), staffAEmail))
                .isInstanceOf(AccessDeniedException.class);
        assertThat(chatService.assignStaff(open.id(), staffBEmail).assignedStaffId()).isNotNull();
    }

    @Test
    void demotingAssignedStaffReleasesOpenChatAndRejectsStaleStaffOperations() {
        ConversationResponse open = chatService.startMyCustomerConversation(customerEmail);
        chatService.assignStaff(open.id(), staffAEmail);
        User staff = userRepository.findByEmailIgnoreCase(staffAEmail).orElseThrow();

        adminUserService.changeRole(staff.getId(), new ChangeUserRoleRequest(RoleName.POS_STAFF, staff.getVersion()), adminEmail);

        assertThat(conversationRepository.findById(open.id()).orElseThrow().getAssignedStaff()).isNull();
        assertThatThrownBy(() -> chatService.assignStaff(open.id(), staffAEmail))
                .isInstanceOf(AccessDeniedException.class);
        assertThatThrownBy(() -> chatService.getMessages(open.id(), PageRequest.of(0, 20), staffAEmail))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void concurrentInFlightClaimAndDisableCannotLeaveInactiveStaffAssigned() throws Exception {
        ConversationResponse open = chatService.startMyCustomerConversation(customerEmail);
        User staff = userRepository.findByEmailIgnoreCase(staffAEmail).orElseThrow();
        CountDownLatch claimed = new CountDownLatch(1);
        CountDownLatch allowCommit = new CountDownLatch(1);
        AtomicInteger disablePid = new AtomicInteger();
        TransactionTemplate transaction = new TransactionTemplate(transactionManager);
        try (var executor = Executors.newFixedThreadPool(2)) {
            Future<?> claim = executor.submit(() -> transaction.executeWithoutResult(status -> {
                chatService.assignStaff(open.id(), staffAEmail);
                claimed.countDown();
                awaitCommit(allowCommit);
            }));
            Future<?> disable = null;
            try {
                assertThat(claimed.await(10, TimeUnit.SECONDS)).isTrue();
                disable = executor.submit(() -> transaction.execute(status -> {
                    disablePid.set(jdbcTemplate.queryForObject("SELECT pg_backend_pid()", Integer.class));
                    return adminUserService.disableUser(staff.getId(), staff.getVersion(), adminEmail);
                }));
                waitUntilBlockedOrDone(disablePid, disable);
                assertThat(disable.isDone()).as("Disable must wait for the in-flight staff claim").isFalse();
            } finally {
                allowCommit.countDown();
            }
            claim.get(15, TimeUnit.SECONDS);
            assertThat(disable).isNotNull();
            disable.get(15, TimeUnit.SECONDS);
        }
        assertThat(userRepository.findById(staff.getId()).orElseThrow().isActive()).isFalse();
        assertThat(conversationRepository.findById(open.id()).orElseThrow().getAssignedStaff()).isNull();
        assertThatThrownBy(() -> chatService.assignStaff(open.id(), staffAEmail))
                .isInstanceOf(AccessDeniedException.class);
    }

    private void awaitCommit(CountDownLatch latch) {
        try {
            if (!latch.await(15, TimeUnit.SECONDS)) throw new IllegalStateException("Timed out waiting for chat transaction.");
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Chat transaction interrupted.", ex);
        }
    }

    private void waitUntilBlockedOrDone(AtomicInteger pid, Future<?> task) throws Exception {
        long deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(10);
        while (System.nanoTime() < deadline) {
            if (task.isDone()) return;
            if (pid.get() != 0 && Boolean.TRUE.equals(jdbcTemplate.queryForObject(
                    "SELECT EXISTS (SELECT 1 FROM pg_stat_activity WHERE pid = ? AND wait_event_type = 'Lock')",
                    Boolean.class, pid.get()))) return;
            Thread.sleep(20);
        }
        throw new IllegalStateException("Concurrent chat request did not reach its database lock.");
    }

    @Test
    void readingOnePageLeavesUnseenIncomingMessagesUnread() {
        ConversationResponse conversation = chatService.startMyCustomerConversation(customerEmail);
        chatService.assignStaff(conversation.id(), staffAEmail);
        chatService.sendMessage(conversation.id(), new ChatMessageRequest("First paginated message"), customerEmail);
        chatService.sendMessage(conversation.id(), new ChatMessageRequest("Second paginated message"), customerEmail);
        Long staffId = userRepository.findByEmailIgnoreCase(staffAEmail).orElseThrow().getId();

        Page<ChatMessageResponse> firstPage = chatService.getMessages(conversation.id(), PageRequest.of(0, 1), staffAEmail);

        assertThat(firstPage.getContent()).hasSize(1);
        assertThat(firstPage.getContent().getFirst().content()).isEqualTo("Second paginated message");
        assertThat(firstPage.getContent().getFirst().isRead()).isTrue();
        assertThat(chatMessageRepository.countByConversationIdAndSenderIdNotAndIsReadFalse(conversation.id(), staffId)).isEqualTo(1);
        var olderPage = chatService.getMessages(conversation.id(), PageRequest.of(1, 1), staffAEmail);
        assertThat(olderPage.getContent().getFirst().content()).isEqualTo("First paginated message");
    }

    @Test
    @DisplayName("Real two-staff simultaneous claim race against PostgreSQL: exactly one wins, one conflicts, repeated 5 iterations")
    void simultaneousTwoStaffClaimRace_exactlyOneWins() throws Exception {
        int iterations = 5;

        for (int iter = 1; iter <= iterations; iter++) {
            // 1. Customer creates an OPEN unassigned conversation
            ConversationResponse customerConv = chatService.startMyCustomerConversation(customerEmail);
            Long conversationId = customerConv.id();

            // Verify clean pre-conditions
            Conversation preCheck = conversationRepository.findById(conversationId).orElseThrow();
            assertThat(preCheck.getStatus()).isEqualTo(ConversationStatus.OPEN);
            assertThat(preCheck.getAssignedStaff()).isNull();

            // 2. Prepare Staff A and Staff B simultaneous claim race
            CountDownLatch readyLatch = new CountDownLatch(2);
            CountDownLatch startLatch = new CountDownLatch(1);

            AtomicInteger successCount = new AtomicInteger(0);
            AtomicInteger conflictCount = new AtomicInteger(0);
            List<String> winnerList = Collections.synchronizedList(new ArrayList<>());
            List<String> loserList = Collections.synchronizedList(new ArrayList<>());

            try (var executor = Executors.newFixedThreadPool(2)) {
                List<Future<?>> requests = new ArrayList<>();
                for (String staffEmail : List.of(staffAEmail, staffBEmail)) {
                    requests.add(executor.submit(() -> {
                        readyLatch.countDown();
                        if (!startLatch.await(10, TimeUnit.SECONDS)) {
                            throw new IllegalStateException("Timed out waiting for simultaneous chat claim.");
                        }
                        try {
                            chatService.assignStaff(conversationId, staffEmail);
                            successCount.incrementAndGet();
                            winnerList.add(staffEmail);
                        } catch (IllegalStateException e) {
                            assertThat(e).hasMessage("Cuộc trò chuyện đã được một nhân viên khác tiếp nhận.");
                            conflictCount.incrementAndGet();
                            loserList.add(staffEmail);
                        }
                        return null;
                    }));
                }
                assertThat(readyLatch.await(5, TimeUnit.SECONDS)).isTrue();
                startLatch.countDown();
                for (Future<?> request : requests) {
                    request.get(10, TimeUnit.SECONDS);
                }
            }

            // Verify results for this iteration
            assertThat(successCount.get())
                    .as("Iteration %d: exactly 1 staff must win the race", iter)
                    .isEqualTo(1);
            assertThat(conflictCount.get())
                    .as("Iteration %d: exactly 1 staff must lose with conflict", iter)
                    .isEqualTo(1);
            assertThat(winnerList).hasSize(1);
            assertThat(loserList).hasSize(1);

            String winnerEmail = winnerList.get(0);
            String loserEmail = loserList.get(0);
            assertThat(winnerEmail).isNotEqualTo(loserEmail);

            // Verify final DB state in PostgreSQL
            Conversation finalConv = conversationRepository.findById(conversationId).orElseThrow();
            assertThat(finalConv.getStatus()).isEqualTo(ConversationStatus.OPEN);
            assertThat(finalConv.getAssignedStaff()).isNotNull();
            User expectedWinner = userRepository.findByEmailIgnoreCase(winnerEmail).orElseThrow();
            assertThat(finalConv.getAssignedStaff().getId()).isEqualTo(expectedWinner.getId());

            // Close the conversation to reset for next iteration
            chatService.closeConversation(conversationId, winnerEmail);
        }
    }

    @Test
    @DisplayName("Customer start concurrency: multiple simultaneous requests yield exactly one OPEN conversation")
    void customerStartConcurrency_yieldsExactlyOneOpenConversation() throws Exception {
        int threads = 4;
        CountDownLatch readyLatch = new CountDownLatch(threads);
        CountDownLatch startLatch = new CountDownLatch(1);

        List<ConversationResponse> results = new ArrayList<>();
        try (var executor = Executors.newFixedThreadPool(threads)) {
            List<Future<ConversationResponse>> requests = new ArrayList<>();
            for (int i = 0; i < threads; i++) {
                requests.add(executor.submit(() -> {
                    readyLatch.countDown();
                    if (!startLatch.await(10, TimeUnit.SECONDS)) {
                        throw new IllegalStateException("Timed out waiting for simultaneous chat start.");
                    }
                    return chatService.startMyCustomerConversation(customerEmail);
                }));
            }
            assertThat(readyLatch.await(5, TimeUnit.SECONDS)).isTrue();
            startLatch.countDown();
            for (Future<ConversationResponse> request : requests) {
                results.add(request.get(10, TimeUnit.SECONDS));
            }
        }

        assertThat(results).hasSize(threads);
        Long firstId = results.get(0).id();
        for (ConversationResponse r : results) {
            assertThat(r.id()).isEqualTo(firstId);
            assertThat(r.status()).isEqualTo(ConversationStatus.OPEN);
        }

        User customer = userRepository.findByEmailIgnoreCase(customerEmail).orElseThrow();
        List<Conversation> openConvs = conversationRepository.findByCustomerIdOrderByUpdatedAtDesc(customer.getId())
                .stream()
                .filter(c -> c.getStatus() == ConversationStatus.OPEN)
                .toList();

        assertThat(openConvs).hasSize(1);
    }

    @Test
    @DisplayName("Authorization isolation: Staff B cannot send or close conversation assigned to Staff A")
    void staffB_cannotSendOrCloseAssignedToStaffA() {
        ConversationResponse conv = chatService.startMyCustomerConversation(customerEmail);
        Long conversationId = conv.id();

        chatService.assignStaff(conversationId, staffAEmail);

        // Staff B attempts to send message -> denied
        assertThatThrownBy(() -> chatService.sendMessage(
                conversationId,
                new ChatMessageRequest("Tin nhắn bất hợp pháp"),
                staffBEmail
        )).isInstanceOf(AccessDeniedException.class);

        // Staff B attempts to close -> denied
        assertThatThrownBy(() -> chatService.closeConversation(
                conversationId,
                staffBEmail
        )).isInstanceOf(AccessDeniedException.class);

        // Assigned Staff A can close
        ConversationResponse closed = chatService.closeConversation(conversationId, staffAEmail);
        assertThat(closed.status()).isEqualTo(ConversationStatus.CLOSED);
    }

    @Test
    @DisplayName("Customer IDOR: Customer 2 cannot read or message Customer 1 conversation")
    void customerIdor_denied() {
        ConversationResponse conv = chatService.startMyCustomerConversation(customerEmail);
        Long conversationId = conv.id();

        // Customer 2 attempts to get messages
        assertThatThrownBy(() -> chatService.getMessages(
                conversationId,
                PageRequest.of(0, 50),
                customer2Email
        )).isInstanceOf(AccessDeniedException.class);

        // Customer 2 attempts to send message
        assertThatThrownBy(() -> chatService.sendMessage(
                conversationId,
                new ChatMessageRequest("Spam message"),
                customer2Email
        )).isInstanceOf(AccessDeniedException.class);
    }

    @Test
    @DisplayName("POS_STAFF is denied from all chat service operations")
    void posStaff_denied() {
        ConversationResponse conv = chatService.startMyCustomerConversation(customerEmail);
        Long conversationId = conv.id();

        assertThatThrownBy(() -> chatService.assignStaff(conversationId, posEmail))
                .isInstanceOf(AccessDeniedException.class);

        assertThatThrownBy(() -> chatService.getMessages(conversationId, PageRequest.of(0, 50), posEmail))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    @DisplayName("Closed lifecycle: reading closed conversation does not create new one, explicit start creates new OPEN")
    void closedLifecycle_explicitNewRequired() {
        // 1. Create and claim and close
        ConversationResponse openConv = chatService.startMyCustomerConversation(customerEmail);
        Long firstId = openConv.id();
        chatService.assignStaff(firstId, staffAEmail);
        chatService.closeConversation(firstId, staffAEmail);

        // 2. Customer views support via getMyCustomerConversation -> returns closed session
        ConversationResponse latest = chatService.getMyCustomerConversation(customerEmail);
        assertThat(latest.id()).isEqualTo(firstId);
        assertThat(latest.status()).isEqualTo(ConversationStatus.CLOSED);

        // Verify no open conversation in DB
        User customer = userRepository.findByEmailIgnoreCase(customerEmail).orElseThrow();
        long openCount = conversationRepository.findByCustomerIdOrderByUpdatedAtDesc(customer.getId())
                .stream()
                .filter(c -> c.getStatus() == ConversationStatus.OPEN)
                .count();
        assertThat(openCount).isEqualTo(0);

        // 3. Customer explicitly starts new conversation
        ConversationResponse newConv = chatService.startMyCustomerConversation(customerEmail);
        assertThat(newConv.id()).isNotEqualTo(firstId);
        assertThat(newConv.status()).isEqualTo(ConversationStatus.OPEN);
        assertThat(newConv.assignedStaffId()).isNull();

        // Old conversation is preserved as CLOSED
        Conversation oldInDb = conversationRepository.findById(firstId).orElseThrow();
        assertThat(oldInDb.getStatus()).isEqualTo(ConversationStatus.CLOSED);
        assertThat(oldInDb.getClosedAt()).isNotNull();
    }
}
