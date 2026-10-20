package com.m4n.backend.service;

import com.m4n.backend.dto.request.ChatMessageRequest;
import com.m4n.backend.dto.response.ChatMessageResponse;
import com.m4n.backend.dto.response.ConversationResponse;
import com.m4n.backend.entity.Conversation;
import com.m4n.backend.entity.ConversationStatus;
import com.m4n.backend.entity.User;
import com.m4n.backend.repository.ChatMessageRepository;
import com.m4n.backend.repository.ConversationRepository;
import com.m4n.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.AccessDeniedException;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
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

    private static final String CUSTOMER_EMAIL = "customer@m4n.vn";
    private static final String CUSTOMER2_EMAIL = "customer2@m4n.vn";
    private static final String STAFF_A_EMAIL = "staff@m4n.vn";
    private static final String STAFF_B_EMAIL = "staff2@m4n.vn";
    private static final String POS_EMAIL = "pos@m4n.vn";

    @BeforeEach
    void cleanOpenConversations() {
        // Close or clean up existing open conversations for test customer to ensure clean slate
        User customer = userRepository.findByEmailIgnoreCase(CUSTOMER_EMAIL).orElseThrow();
        List<Conversation> openList = conversationRepository.findByCustomerIdOrderByUpdatedAtDesc(customer.getId());
        for (Conversation c : openList) {
            if (c.getStatus() == ConversationStatus.OPEN) {
                c.setStatus(ConversationStatus.CLOSED);
                conversationRepository.save(c);
            }
        }
    }

    @Test
    @DisplayName("Real two-staff simultaneous claim race against PostgreSQL: exactly one wins, one conflicts, repeated 5 iterations")
    void simultaneousTwoStaffClaimRace_exactlyOneWins() throws Exception {
        int iterations = 5;

        for (int iter = 1; iter <= iterations; iter++) {
            // 1. Customer creates an OPEN unassigned conversation
            ConversationResponse customerConv = chatService.startMyCustomerConversation(CUSTOMER_EMAIL);
            Long conversationId = customerConv.id();

            // Verify clean pre-conditions
            Conversation preCheck = conversationRepository.findById(conversationId).orElseThrow();
            assertThat(preCheck.getStatus()).isEqualTo(ConversationStatus.OPEN);
            assertThat(preCheck.getAssignedStaff()).isNull();

            // 2. Prepare Staff A and Staff B simultaneous claim race
            ExecutorService executor = Executors.newFixedThreadPool(2);
            CountDownLatch readyLatch = new CountDownLatch(2);
            CountDownLatch startLatch = new CountDownLatch(1);

            AtomicInteger successCount = new AtomicInteger(0);
            AtomicInteger conflictCount = new AtomicInteger(0);
            List<String> winnerList = Collections.synchronizedList(new ArrayList<>());
            List<String> loserList = Collections.synchronizedList(new ArrayList<>());

            Runnable staffATask = () -> {
                readyLatch.countDown();
                try {
                    startLatch.await();
                    ConversationResponse resp = chatService.assignStaff(conversationId, STAFF_A_EMAIL);
                    successCount.incrementAndGet();
                    winnerList.add(STAFF_A_EMAIL);
                } catch (IllegalStateException e) {
                    conflictCount.incrementAndGet();
                    loserList.add(STAFF_A_EMAIL);
                } catch (Exception e) {
                    // Unexpected error
                }
            };

            Runnable staffBTask = () -> {
                readyLatch.countDown();
                try {
                    startLatch.await();
                    ConversationResponse resp = chatService.assignStaff(conversationId, STAFF_B_EMAIL);
                    successCount.incrementAndGet();
                    winnerList.add(STAFF_B_EMAIL);
                } catch (IllegalStateException e) {
                    conflictCount.incrementAndGet();
                    loserList.add(STAFF_B_EMAIL);
                } catch (Exception e) {
                    // Unexpected error
                }
            };

            Future<?> f1 = executor.submit(staffATask);
            Future<?> f2 = executor.submit(staffBTask);

            // Wait for both threads to be ready
            readyLatch.await(5, TimeUnit.SECONDS);
            // Fire both threads simultaneously
            startLatch.countDown();

            f1.get(10, TimeUnit.SECONDS);
            f2.get(10, TimeUnit.SECONDS);
            executor.shutdown();

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
        ExecutorService executor = Executors.newFixedThreadPool(threads);
        CountDownLatch readyLatch = new CountDownLatch(threads);
        CountDownLatch startLatch = new CountDownLatch(1);

        List<ConversationResponse> results = Collections.synchronizedList(new ArrayList<>());

        for (int i = 0; i < threads; i++) {
            executor.submit(() -> {
                readyLatch.countDown();
                try {
                    startLatch.await();
                    ConversationResponse resp = chatService.startMyCustomerConversation(CUSTOMER_EMAIL);
                    results.add(resp);
                } catch (Exception e) {
                    // ignore
                }
            });
        }

        readyLatch.await(5, TimeUnit.SECONDS);
        startLatch.countDown();
        executor.shutdown();
        executor.awaitTermination(10, TimeUnit.SECONDS);

        assertThat(results).hasSize(threads);
        Long firstId = results.get(0).id();
        for (ConversationResponse r : results) {
            assertThat(r.id()).isEqualTo(firstId);
            assertThat(r.status()).isEqualTo(ConversationStatus.OPEN);
        }

        User customer = userRepository.findByEmailIgnoreCase(CUSTOMER_EMAIL).orElseThrow();
        List<Conversation> openConvs = conversationRepository.findByCustomerIdOrderByUpdatedAtDesc(customer.getId())
                .stream()
                .filter(c -> c.getStatus() == ConversationStatus.OPEN)
                .toList();

        assertThat(openConvs).hasSize(1);
    }

    @Test
    @DisplayName("Authorization isolation: Staff B cannot send or close conversation assigned to Staff A")
    void staffB_cannotSendOrCloseAssignedToStaffA() {
        ConversationResponse conv = chatService.startMyCustomerConversation(CUSTOMER_EMAIL);
        Long conversationId = conv.id();

        chatService.assignStaff(conversationId, STAFF_A_EMAIL);

        // Staff B attempts to send message -> denied
        assertThatThrownBy(() -> chatService.sendMessage(
                conversationId,
                new ChatMessageRequest("Tin nhắn bất hợp pháp"),
                STAFF_B_EMAIL
        )).isInstanceOf(AccessDeniedException.class);

        // Staff B attempts to close -> denied
        assertThatThrownBy(() -> chatService.closeConversation(
                conversationId,
                STAFF_B_EMAIL
        )).isInstanceOf(AccessDeniedException.class);

        // Assigned Staff A can close
        ConversationResponse closed = chatService.closeConversation(conversationId, STAFF_A_EMAIL);
        assertThat(closed.status()).isEqualTo(ConversationStatus.CLOSED);
    }

    @Test
    @DisplayName("Customer IDOR: Customer 2 cannot read or message Customer 1 conversation")
    void customerIdor_denied() {
        ConversationResponse conv = chatService.startMyCustomerConversation(CUSTOMER_EMAIL);
        Long conversationId = conv.id();

        // Customer 2 attempts to get messages
        assertThatThrownBy(() -> chatService.getMessages(
                conversationId,
                PageRequest.of(0, 50),
                CUSTOMER2_EMAIL
        )).isInstanceOf(AccessDeniedException.class);

        // Customer 2 attempts to send message
        assertThatThrownBy(() -> chatService.sendMessage(
                conversationId,
                new ChatMessageRequest("Spam message"),
                CUSTOMER2_EMAIL
        )).isInstanceOf(AccessDeniedException.class);
    }

    @Test
    @DisplayName("POS_STAFF is denied from all chat service operations")
    void posStaff_denied() {
        ConversationResponse conv = chatService.startMyCustomerConversation(CUSTOMER_EMAIL);
        Long conversationId = conv.id();

        assertThatThrownBy(() -> chatService.assignStaff(conversationId, POS_EMAIL))
                .isInstanceOf(AccessDeniedException.class);

        assertThatThrownBy(() -> chatService.getMessages(conversationId, PageRequest.of(0, 50), POS_EMAIL))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    @DisplayName("Closed lifecycle: reading closed conversation does not create new one, explicit start creates new OPEN")
    void closedLifecycle_explicitNewRequired() {
        // 1. Create and claim and close
        ConversationResponse openConv = chatService.startMyCustomerConversation(CUSTOMER_EMAIL);
        Long firstId = openConv.id();
        chatService.assignStaff(firstId, STAFF_A_EMAIL);
        chatService.closeConversation(firstId, STAFF_A_EMAIL);

        // 2. Customer views support via getMyCustomerConversation -> returns closed session
        ConversationResponse latest = chatService.getMyCustomerConversation(CUSTOMER_EMAIL);
        assertThat(latest.id()).isEqualTo(firstId);
        assertThat(latest.status()).isEqualTo(ConversationStatus.CLOSED);

        // Verify no open conversation in DB
        User customer = userRepository.findByEmailIgnoreCase(CUSTOMER_EMAIL).orElseThrow();
        long openCount = conversationRepository.findByCustomerIdOrderByUpdatedAtDesc(customer.getId())
                .stream()
                .filter(c -> c.getStatus() == ConversationStatus.OPEN)
                .count();
        assertThat(openCount).isEqualTo(0);

        // 3. Customer explicitly starts new conversation
        ConversationResponse newConv = chatService.startMyCustomerConversation(CUSTOMER_EMAIL);
        assertThat(newConv.id()).isNotEqualTo(firstId);
        assertThat(newConv.status()).isEqualTo(ConversationStatus.OPEN);
        assertThat(newConv.assignedStaffId()).isNull();

        // Old conversation is preserved as CLOSED
        Conversation oldInDb = conversationRepository.findById(firstId).orElseThrow();
        assertThat(oldInDb.getStatus()).isEqualTo(ConversationStatus.CLOSED);
        assertThat(oldInDb.getClosedAt()).isNotNull();
    }
}
