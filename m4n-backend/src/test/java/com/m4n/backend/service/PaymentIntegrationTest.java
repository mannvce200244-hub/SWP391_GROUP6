package com.m4n.backend.service;

import com.m4n.backend.entity.*;
import com.m4n.backend.entity.Order;
import com.m4n.backend.exception.PaymentProviderException;
import com.m4n.backend.repository.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.util.LinkedMultiValueMap;
import java.math.BigDecimal;
import java.util.*;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@SpringBootTest(properties = {"m4n.payment.vnpay.enabled=true", "m4n.payment.vnpay.merchant-code=TEST1234",
        "m4n.payment.vnpay.hash-secret=test-only-private-secret", "m4n.payment.vnpay.return-url=https://m4n.test/payment-return",
        "m4n.payment.vnpay.ipn-url=https://m4n.test/api/v1/payments/vnpay/ipn", "m4n.payment.vnpay.server-ip=127.0.0.1"})
class PaymentIntegrationTest {
    @Autowired PaymentService service;
    @Autowired OrderRepository orders;
    @Autowired PaymentAttemptRepository payments;
    @Autowired UserRepository users;
    @Autowired RoleRepository roles;
    @Autowired JdbcTemplate jdbc;
    @MockitoBean VnpayGateway gateway;
    User customer; User admin; Order order;
    @BeforeEach void createFixtures() {
        String id = UUID.randomUUID().toString();
        customer = user("pay-customer-" + id, RoleName.CUSTOMER);
        admin = user("pay-admin-" + id, RoleName.ADMIN);
        order = orders.saveAndFlush(Order.builder().orderCode("PAY-" + id).user(customer).customerName("Payment fixture")
                .customerPhone("0900000000").customerEmail(customer.getEmail()).shippingAddress("Test address")
                .totalAmount(new BigDecimal("100000")).finalAmount(new BigDecimal("100000"))
                .paymentMethod("VNPAY").status(OrderStatus.PENDING_CONFIRMATION).build());
        when(gateway.paymentUrl(anyMap())).thenReturn("https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?test=1");
        when(gateway.verifyIpn(anyMap())).thenReturn(true);
    }
    @AfterEach void cleanup() {
        jdbc.update("DELETE FROM payment_attempts WHERE order_id = ?", order.getId());
        orders.deleteById(order.getId());
        users.deleteById(customer.getId()); users.deleteById(admin.getId());
    }
    @Test void urlUsesPersistedBackendAmountAndDoesNotMarkPaidOrChangeFulfillment() {
        var url = service.createPayment(order.getId(), customer.getEmail(), "127.0.0.1");
        var captured = org.mockito.ArgumentCaptor.forClass(Map.class);
        verify(gateway).paymentUrl(captured.capture());
        assertThat(captured.getValue()).containsEntry("vnp_Amount", "10000000").containsEntry("vnp_CurrCode", "VND");
        assertThat(url.transactionReference()).isEqualTo(attempt().getTransactionReference());
        assertThat(reload().isPaid()).isFalse();
        assertThat(reload().getStatus()).isEqualTo(OrderStatus.PENDING_CONFIRMATION);
        assertThat(service.getStatus(order.getId(), customer.getEmail()).canPay()).isTrue();
    }
    @Test void validIpnMarksPaidOnceWithoutDeductingStockOrCompletingOrder() {
        start();
        var result = ipn(paymentResult("00", "00"));
        assertThat(result.rspCode()).isEqualTo("00");
        assertThat(ipn(paymentResult("00", "00")).rspCode()).isEqualTo("02");
        assertThat(reload().isPaid()).isTrue();
        assertThat(reload().getStatus()).isEqualTo(OrderStatus.PENDING_CONFIRMATION);
    }
    @Test void simultaneousPaymentCreationReusesOnePersistedAttempt() throws Exception {
        CountDownLatch start = new CountDownLatch(1);
        try (var executor = Executors.newFixedThreadPool(2)) {
            var first = executor.submit(() -> { start.await(); return service.createPayment(order.getId(), customer.getEmail(), "127.0.0.1"); });
            var second = executor.submit(() -> { start.await(); return service.createPayment(order.getId(), customer.getEmail(), "127.0.0.1"); });
            start.countDown();
            assertThat(first.get(15, TimeUnit.SECONDS).transactionReference()).isEqualTo(second.get(15, TimeUnit.SECONDS).transactionReference());
        }
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM payment_attempts WHERE order_id = ?", Long.class, order.getId())).isEqualTo(1);
    }
    @Test void simultaneousVerifiedCallbacksMarkPaidOnce() throws Exception {
        start(); Map<String, String> result = paymentResult("00", "00");
        CountDownLatch start = new CountDownLatch(1);
        try (var executor = Executors.newFixedThreadPool(2)) {
            var first = executor.submit(() -> { start.await(); return ipn(result).rspCode(); });
            var second = executor.submit(() -> { start.await(); return ipn(result).rspCode(); });
            start.countDown();
            assertThat(List.of(first.get(15, TimeUnit.SECONDS), second.get(15, TimeUnit.SECONDS))).containsExactlyInAnyOrder("00", "02");
        }
        assertThat(reload().isPaid()).isTrue();
        assertThat(reload().getStatus()).isEqualTo(OrderStatus.PENDING_CONFIRMATION);
    }
    @Test void signatureAmountMerchantAndDuplicateParameterFailuresLeaveOrderUnpaid() {
        start();
        when(gateway.verifyIpn(anyMap())).thenReturn(false);
        assertThat(ipn(paymentResult("00", "00")).rspCode()).isEqualTo("97");
        when(gateway.verifyIpn(anyMap())).thenReturn(true);
        Map<String, String> wrong = paymentResult("00", "00"); wrong.put("vnp_Amount", "1");
        assertThat(ipn(wrong).rspCode()).isEqualTo("04");
        wrong = paymentResult("00", "00"); wrong.put("vnp_TmnCode", "OTHER123");
        assertThat(ipn(wrong).rspCode()).isEqualTo("97");
        var duplicate = new LinkedMultiValueMap<String, String>(); paymentResult("00", "00").forEach(duplicate::add);
        duplicate.add("vnp_Amount", "1");
        assertThat(service.processIpn(duplicate).rspCode()).isEqualTo("97");
        assertThat(reload().isPaid()).isFalse();
    }
    @Test void ownerIsolationAndIntegralVndValidationAreBackendEnforced() {
        assertThatThrownBy(() -> service.createPayment(order.getId(), admin.getEmail(), "127.0.0.1"))
                .isInstanceOf(org.springframework.security.access.AccessDeniedException.class);
        assertThatThrownBy(() -> service.validatePaymentAmount(new BigDecimal("5000.01"))).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.validatePaymentAmount(new BigDecimal("4999"))).isInstanceOf(IllegalArgumentException.class);
        assertThatCode(() -> service.validatePaymentAmount(new BigDecimal("5000.00"))).doesNotThrowAnyException();
    }
    @Test void currentNonCustomerRoleCannotStartPaymentForPreviouslyOwnedCustomerOrder() {
        customer.setRole(roles.findByName(RoleName.POS_STAFF).orElseThrow());
        users.saveAndFlush(customer);
        assertThatThrownBy(() -> service.createPayment(order.getId(), customer.getEmail(), "127.0.0.1"))
                .isInstanceOf(org.springframework.security.access.AccessDeniedException.class);
        verify(gateway, never()).paymentUrl(anyMap());
    }
    @Test void lateVerifiedPaymentOnCancelledOrderRemainsVisibleAndRefundable() {
        start(); order.setStatus(OrderStatus.CANCELLED); orders.saveAndFlush(order);
        assertThat(ipn(paymentResult("00", "00")).rspCode()).isEqualTo("00");
        assertThat(reload().getStatus()).isEqualTo(OrderStatus.CANCELLED);
        assertThat(service.getStatus(order.getId(), admin.getEmail()).canRefund()).isTrue();
    }
    @Test void acceptedPendingRefundDoesNotAllowCancellationUntilVerifiedReconciliation() {
        paid(); when(gateway.refund(anyMap())).thenReturn(refundResult("refund", "00", "05"));
        var pending = service.refund(order.getId(), "Hết hàng", admin.getEmail(), "127.0.0.1");
        assertThat(pending.refundStatus()).isEqualTo("PENDING");
        assertThat(service.hasVerifiedFullRefund(order.getId())).isFalse();
        assertThatThrownBy(() -> service.refund(order.getId(), "Retry", admin.getEmail(), "127.0.0.1"))
                .isInstanceOf(IllegalStateException.class);
        verify(gateway, times(1)).refund(anyMap());
        when(gateway.query(anyMap())).thenReturn(refundResult("querydr", "00", "00"));
        assertThat(service.reconcileRefund(order.getId(), admin.getEmail(), "127.0.0.1").refundStatus()).isEqualTo("SUCCEEDED");
        assertThat(service.hasVerifiedFullRefund(order.getId())).isTrue();
        assertThat(reload().getStatus()).isEqualTo(OrderStatus.PENDING_CONFIRMATION);
    }
    @Test void refundTimeoutRemainsPendingAndRequiresReconciliationInsteadOfResubmission() {
        paid(); when(gateway.refund(anyMap())).thenThrow(new PaymentProviderException());
        assertThat(service.refund(order.getId(), "Customer request", admin.getEmail(), "127.0.0.1").refundStatus()).isEqualTo("PENDING");
        assertThat(service.isRefundPending(order.getId())).isTrue();
        assertThat(service.hasVerifiedFullRefund(order.getId())).isFalse();
    }
    @Test void unspecifiedProviderRefundErrorRemainsPendingInsteadOfAllowingBlindResubmission() {
        paid(); when(gateway.refund(anyMap())).thenReturn(refundResult("refund", "99", "05"));
        assertThat(service.refund(order.getId(), "Customer request", admin.getEmail(), "127.0.0.1").refundStatus()).isEqualTo("PENDING");
        assertThatThrownBy(() -> service.refund(order.getId(), "Retry", admin.getEmail(), "127.0.0.1"))
                .isInstanceOf(IllegalStateException.class);
        verify(gateway, times(1)).refund(anyMap());
    }
    @Test void pendingRefundIsCommittedBeforeProviderCallAndBlocksConcurrentResubmission() throws Exception {
        paid(); Map<String, String> result = refundResult("refund", "00", "00");
        CountDownLatch requestStarted = new CountDownLatch(1);
        CountDownLatch allowResponse = new CountDownLatch(1);
        when(gateway.refund(anyMap())).thenAnswer(invocation -> {
            requestStarted.countDown();
            if (!allowResponse.await(10, TimeUnit.SECONDS)) throw new IllegalStateException("Timed out waiting for simulated provider response.");
            return result;
        });
        try (var executor = Executors.newSingleThreadExecutor()) {
            var refund = executor.submit(() -> service.refund(order.getId(), "Customer request", admin.getEmail(), "127.0.0.1"));
            try {
                assertThat(requestStarted.await(10, TimeUnit.SECONDS)).isTrue();
                assertThat(service.isRefundPending(order.getId())).isTrue();
                assertThatThrownBy(() -> service.refund(order.getId(), "Duplicate", admin.getEmail(), "127.0.0.1"))
                        .isInstanceOf(IllegalStateException.class);
                verify(gateway, times(1)).refund(anyMap());
            } finally {
                allowResponse.countDown();
            }
            assertThat(refund.get(15, TimeUnit.SECONDS).refundStatus()).isEqualTo("SUCCEEDED");
        }
    }
    @Test void lateResponseForReplacedRefundRequestCannotClearCurrentPendingRefund() throws Exception {
        paid();
        Map<String, String> oldFailure = refundResult("refund", "95", "09");
        Map<String, String> newPending = refundResult("refund", "00", "05");
        CountDownLatch firstSent = new CountDownLatch(1);
        CountDownLatch allowOldResponse = new CountDownLatch(1);
        AtomicInteger requestCount = new AtomicInteger();
        when(gateway.refund(anyMap())).thenAnswer(invocation -> {
            if (requestCount.incrementAndGet() == 1) {
                firstSent.countDown();
                if (!allowOldResponse.await(15, TimeUnit.SECONDS)) throw new IllegalStateException("Timed out waiting for old refund response.");
                return oldFailure;
            }
            return newPending;
        });
        when(gateway.query(anyMap())).thenReturn(refundResult("querydr", "00", "09"));
        try (var executor = Executors.newSingleThreadExecutor()) {
            var oldRefund = executor.submit(() -> service.refund(order.getId(), "First", admin.getEmail(), "127.0.0.1"));
            String currentRequest;
            try {
                assertThat(firstSent.await(10, TimeUnit.SECONDS)).isTrue();
                assertThat(service.reconcileRefund(order.getId(), admin.getEmail(), "127.0.0.1").refundStatus()).isEqualTo("FAILED");
                assertThat(service.refund(order.getId(), "New explicit request", admin.getEmail(), "127.0.0.1").refundStatus()).isEqualTo("PENDING");
                currentRequest = attempt().getRefundRequestId();
            } finally {
                allowOldResponse.countDown();
            }
            assertThat(oldRefund.get(15, TimeUnit.SECONDS).refundStatus()).isEqualTo("PENDING");
            assertThat(attempt().getRefundRequestId()).isEqualTo(currentRequest);
            assertThat(service.isRefundPending(order.getId())).isTrue();
        }
        verify(gateway, times(2)).refund(anyMap());
    }
    @Test void mismatchedRefundResponseCannotMarkFundsReturned() {
        paid(); Map<String, String> response = refundResult("refund", "00", "00"); response.put("vnp_Amount", "10");
        when(gateway.refund(anyMap())).thenReturn(response);
        assertThat(service.refund(order.getId(), "Customer request", admin.getEmail(), "127.0.0.1").refundStatus()).isEqualTo("PENDING");
        assertThat(service.hasVerifiedFullRefund(order.getId())).isFalse();
    }
    @Test void customersCannotRefundAndCompletedOrdersAreNotRefundableByThisWorkflow() {
        paid(); assertThat(service.getStatus(order.getId(), customer.getEmail()).canRefund()).isFalse();
        assertThatThrownBy(() -> service.refund(order.getId(), "Refund", customer.getEmail(), "127.0.0.1"))
                .isInstanceOf(org.springframework.security.access.AccessDeniedException.class);
        order = reload(); order.setStatus(OrderStatus.COMPLETED); orders.saveAndFlush(order);
        assertThat(service.getStatus(order.getId(), admin.getEmail()).canRefund()).isFalse();
    }
    @Test void verifiedQueryUpdatesOnlyPaymentStateAndExpiredUnknownAttemptCannotCreateDuplicateCharge() {
        start(); var attempt = attempt(); attempt.setExpiresAt(java.time.Instant.now().minusSeconds(1)); payments.saveAndFlush(attempt);
        assertThat(service.getStatus(order.getId(), customer.getEmail()).canPay()).isFalse();
        assertThatThrownBy(() -> service.createPayment(order.getId(), customer.getEmail(), "127.0.0.1"))
                .isInstanceOf(IllegalStateException.class);
        Map<String, String> result = paymentResult("00", "00"); result.put("vnp_Command", "querydr"); result.put("vnp_TransactionType", "01");
        when(gateway.query(anyMap())).thenReturn(result);
        assertThat(service.reconcilePayment(order.getId(), customer.getEmail(), "127.0.0.1").isPaid()).isTrue();
        assertThat(reload().getStatus()).isEqualTo(OrderStatus.PENDING_CONFIRMATION);
    }
    @Test void reconciliationRechecksCurrentRoleAndOwnershipAfterExternalProviderResponse() throws Exception {
        start();
        admin.setRole(roles.findByName(RoleName.ONLINE_STAFF).orElseThrow());
        admin = users.saveAndFlush(admin);
        Map<String, String> result = paymentResult("00", "00");
        result.put("vnp_Command", "querydr");
        result.put("vnp_TransactionType", "01");
        CountDownLatch querySent = new CountDownLatch(1);
        CountDownLatch allowResponse = new CountDownLatch(1);
        when(gateway.query(anyMap())).thenAnswer(invocation -> {
            querySent.countDown();
            if (!allowResponse.await(15, TimeUnit.SECONDS)) throw new IllegalStateException("Timed out waiting for query response.");
            return result;
        });
        try (var executor = Executors.newSingleThreadExecutor()) {
            var query = executor.submit(() -> service.reconcilePayment(order.getId(), admin.getEmail(), "127.0.0.1"));
            try {
                assertThat(querySent.await(10, TimeUnit.SECONDS)).isTrue();
                admin.setRole(roles.findByName(RoleName.CUSTOMER).orElseThrow());
                admin = users.saveAndFlush(admin);
            } finally {
                allowResponse.countDown();
            }
            assertThatThrownBy(() -> query.get(15, TimeUnit.SECONDS))
                    .hasCauseInstanceOf(org.springframework.security.access.AccessDeniedException.class);
        }
        assertThat(reload().isPaid()).isFalse();
        assertThat(service.isPaymentPending(order.getId())).isTrue();
    }
    @Test void originalChargeQueryCannotDeclarePendingFullRefundRejected() {
        paid(); when(gateway.refund(anyMap())).thenReturn(refundResult("refund", "00", "05"));
        service.refund(order.getId(), "Customer request", admin.getEmail(), "127.0.0.1");
        Map<String, String> originalCharge = refundResult("querydr", "00", "09");
        originalCharge.put("vnp_TransactionType", "01");
        when(gateway.query(anyMap())).thenReturn(originalCharge);
        assertThat(service.reconcileRefund(order.getId(), admin.getEmail(), "127.0.0.1").refundStatus()).isEqualTo("PENDING");
        assertThat(service.hasVerifiedFullRefund(order.getId())).isFalse();
    }
    private User user(String email, RoleName role) { return users.saveAndFlush(User.builder().email(email + "@m4n.test")
            .fullName("Payment fixture").password("encoded-test-only").role(roles.findByName(role).orElseThrow()).isActive(true).build()); }
    private void start() { service.createPayment(order.getId(), customer.getEmail(), "127.0.0.1"); }
    private void paid() { start(); ipn(paymentResult("00", "00")); }
    private Order reload() { return orders.findById(order.getId()).orElseThrow(); }
    private PaymentAttempt attempt() { return payments.findFirstByOrderIdOrderByIdDesc(order.getId()).orElseThrow(); }
    private com.m4n.backend.dto.response.VnpayIpnResponse ipn(Map<String, String> map) {
        var params = new LinkedMultiValueMap<String, String>(); map.forEach(params::add); return service.processIpn(params); }
    private Map<String, String> paymentResult(String code, String status) { return new HashMap<>(Map.of(
            "vnp_TmnCode", "TEST1234", "vnp_TxnRef", attempt().getTransactionReference(), "vnp_Amount", "10000000",
            "vnp_ResponseCode", code, "vnp_TransactionStatus", status, "vnp_TransactionNo", "123456",
            "vnp_BankCode", "NCB", "vnp_PayDate", "20261010230000")); }
    private Map<String, String> refundResult(String command, String code, String status) { var map = paymentResult(code, status);
        map.put("vnp_Command", command); map.put("vnp_TransactionType", "02"); map.put("vnp_ResponseId", "RefundResponse123"); return map; }
}
