package com.m4n.backend.service;
import com.m4n.backend.entity.*;
import com.m4n.backend.entity.Order;
import com.m4n.backend.exception.PaymentProviderException;
import com.m4n.backend.exception.MomoCreateRejectedException;
import com.m4n.backend.config.MomoProperties;
import com.m4n.backend.service.serviceImpl.MomoGatewayImpl;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.http.MediaType;
import com.m4n.backend.repository.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import java.math.BigDecimal;
import java.util.*;
import java.util.concurrent.*;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {"m4n.payment.momo.enabled=true", "m4n.payment.momo.partner-code=MOMO_TEST",
        "m4n.payment.momo.access-key=test-access", "m4n.payment.momo.secret-key=test-only-private-secret",
        "m4n.payment.momo.redirect-url=https://m4n.test/payment-return",
        "m4n.cors.allowed-origins=http://localhost:5173,https://m4n.test",
        "m4n.payment.momo.ipn-url=https://m4n.test/api/v1/payments/momo/ipn"})
class MomoPaymentIntegrationTest {
    @Autowired MomoPaymentService momo;
    @Autowired PaymentService payments;
    @Autowired OrderService orderService;
    @Autowired OrderRepository orders;
    @Autowired PaymentAttemptRepository attempts;
    @Autowired UserRepository users;
    @Autowired RoleRepository roles;
    @Autowired WebApplicationContext context;
    @MockitoBean MomoGateway gateway;
    User customer, admin; Order order;

    @BeforeEach void fixtures() {
        String suffix = UUID.randomUUID().toString();
        customer = users.saveAndFlush(User.builder().email("momo-customer-" + suffix + "@example.test")
                .fullName("MoMo customer").password("fixture-only").isActive(true).role(roles.findByName(RoleName.CUSTOMER).orElseThrow()).build());
        admin = users.saveAndFlush(User.builder().email("momo-admin-" + suffix + "@example.test")
                .fullName("MoMo admin").password("fixture-only").isActive(true).role(roles.findByName(RoleName.ADMIN).orElseThrow()).build());
        order = orders.saveAndFlush(Order.builder().orderCode("MOMO-" + suffix).user(customer).customerName("MoMo fixture")
                .customerPhone("0900000000").customerEmail(customer.getEmail()).shippingAddress("Test address")
                .totalAmount(BigDecimal.valueOf(100000)).finalAmount(BigDecimal.valueOf(100000))
                .paymentMethod("MOMO").status(OrderStatus.PENDING_CONFIRMATION).build());
        when(gateway.create(anyString(), any(), anyLong(), anyString(), anyString())).thenReturn("https://test-payment.momo.vn/v2/gateway/pay?test=1");
        when(gateway.verifyIpn(anyMap())).thenReturn(true);
    }

    @Test void timeoutPersistsPendingAndBlocksDuplicateChargeAndCancellation() {
        when(gateway.create(anyString(), any(), anyLong(), anyString(), anyString())).thenThrow(new PaymentProviderException());
        assertThatThrownBy(() -> momo.create(order.getId(), customer.getEmail(), null)).isInstanceOf(PaymentProviderException.class);
        assertThat(attempt().getState()).isEqualTo(PaymentState.PENDING);
        assertThatThrownBy(() -> momo.create(order.getId(), customer.getEmail(), null)).isInstanceOf(IllegalStateException.class);
        verify(gateway, times(1)).create(anyString(), any(), anyLong(), anyString(), anyString());
        assertThat(payments.isPaymentPending(order.getId())).isTrue();
        assertThat(momo.status(order.getId(), customer.getEmail()).canPay()).isFalse();
        authenticate(customer);
        assertThatThrownBy(() -> orderService.customerCancelOrder(order.getId(), "Cancel test"))
                .isInstanceOf(IllegalStateException.class).hasMessageContaining("đối soát");
    }

    @Test void urlCreationIsUnpaidAndRepeatedCallsReuseOneAttempt() {
        order.setCustomerEmail("recipient@example.test");
        orders.saveAndFlush(order);
        var first = momo.create(order.getId(), customer.getEmail(), null);
        var next = momo.create(order.getId(), customer.getEmail(), null);
        assertThat(first).isEqualTo(next);
        verify(gateway, times(1)).create(anyString(), eq(BigDecimal.valueOf(100000).setScale(2)), eq(order.getId()), eq(order.getCustomerEmail()), eq("https://m4n.test/payment-return"));
        assertThat(reload().isPaid()).isFalse();
        assertThat(reload().getStatus()).isEqualTo(OrderStatus.PENDING_CONFIRMATION);
        assertThat(payments.getOptions().momoAvailable()).isTrue();
    }

    @Test void localhostCreationUsesSameOriginAndKeepsTheExistingAttemptOnRetry() throws Exception {
        MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build()
                .perform(post("/api/v1/payments/orders/" + order.getId() + "/momo")
                        .header("Origin", "http://localhost:5173")
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors
                                .user(customer.getEmail()).roles("CUSTOMER")))
                .andExpect(status().isOk());
        momo.create(order.getId(), customer.getEmail(), "https://m4n.test");
        verify(gateway, times(1)).create(anyString(), any(), eq(order.getId()), eq(order.getCustomerEmail()),
                eq("http://localhost:5173/payment-return"));
        assertThat(reload().isPaid()).isFalse();
    }

    @Test void publicCheckoutKeepsItsHttpsOrigin() {
        momo.create(order.getId(), customer.getEmail(), "https://m4n.test");
        verify(gateway).create(anyString(), any(), eq(order.getId()), anyString(), eq("https://m4n.test/payment-return"));
    }

    @Test void foreignOriginCannotAllocateAnAttempt() {
        assertThatThrownBy(() -> momo.create(order.getId(), customer.getEmail(), "https://evil.test"))
                .isInstanceOf(IllegalArgumentException.class);
        assertThat(attempts.findFirstByOrderIdOrderByIdDesc(order.getId())).isEmpty();
        verifyNoInteractions(gateway);
    }

    @Test void signatureAmountReferenceAndPendingResultsCannotMarkPaid() {
        momo.create(order.getId(), customer.getEmail(), null);
        when(gateway.verifyIpn(anyMap())).thenReturn(false);
        assertThatThrownBy(() -> momo.processIpn(result("0"))).isInstanceOf(IllegalArgumentException.class);
        when(gateway.verifyIpn(anyMap())).thenReturn(true);
        var wrong = result("0"); wrong.put("amount", "1");
        assertThatThrownBy(() -> momo.processIpn(wrong)).isInstanceOf(PaymentProviderException.class);
        momo.processIpn(result("9000")); momo.processIpn(result("7000"));
        assertThat(reload().isPaid()).isFalse();
        assertThat(attempt().getState()).isEqualTo(PaymentState.PENDING);
        assertThatThrownBy(() -> momo.create(order.getId(), admin.getEmail(), null)).isInstanceOf(org.springframework.security.access.AccessDeniedException.class);
    }

    @Test void concurrentVerifiedCallbacksMarkPaidWithoutFulfillingOrder() throws Exception {
        momo.create(order.getId(), customer.getEmail(), null);
        var result = result("0"); var gate = new CountDownLatch(1);
        try (var pool = Executors.newFixedThreadPool(2)) {
            var one = pool.submit(() -> { gate.await(); momo.processIpn(result); return true; });
            var two = pool.submit(() -> { gate.await(); momo.processIpn(result); return true; });
            gate.countDown();
            assertThat(one.get(15, TimeUnit.SECONDS) && two.get(15, TimeUnit.SECONDS)).isTrue();
        }
        assertThat(reload().isPaid()).isTrue();
        assertThat(reload().getStatus()).isEqualTo(OrderStatus.PENDING_CONFIRMATION);
    }

    @Test void pendingRefundReusesSameIdAndVerifiedRefundAllowsCancellationWithoutErasingChargeHistory() {
        momo.create(order.getId(), customer.getEmail(), null); momo.processIpn(result("0"));
        when(gateway.refund(anyString(), anyString(), any(), anyString())).thenThrow(new PaymentProviderException());
        assertThat(payments.refund(order.getId(), "Test refund", admin.getEmail(), "127.0.0.1").refundStatus()).isEqualTo("PENDING");
        String refund = attempt().getRefundRequestId();
        assertThat(payments.hasVerifiedFullRefund(order.getId())).isFalse();
        assertThat(reload().isPaid()).isTrue();
        authenticate(customer);
        assertThat(orderService.customerCancelOrder(order.getId(), "Cancel test").status()).isEqualTo(OrderStatus.PENDING_CONFIRMATION);
        assertThat(attempt().getRefundRequestId()).isEqualTo(refund);
        authenticate(admin);
        assertThatThrownBy(() -> orderService.confirmOrder(order.getId()))
                .isInstanceOf(IllegalStateException.class);
        when(gateway.refund(eq(refund), eq("123456789"), any(), eq("Test refund")))
                .thenReturn(Map.of("resultCode", "0", "transId", "987654321"));
        var response = payments.reconcileRefund(order.getId(), admin.getEmail(), "127.0.0.1");
        assertThat(response.refundStatus()).isEqualTo("SUCCEEDED");
        verify(gateway, times(3)).refund(eq(refund), eq("123456789"), any(), eq("Test refund"));
        assertThat(reload().isPaid()).isTrue();
        assertThat(payments.hasVerifiedFullRefund(order.getId())).isTrue();
        momo.processIpn(result("0"));
        assertThat(reload().isPaid()).isTrue();
        assertThat(reload().getStatus()).isEqualTo(OrderStatus.CANCELLED);
        assertThatThrownBy(() -> orderService.confirmOrder(order.getId()))
                .isInstanceOf(IllegalArgumentException.class);
        authenticate(customer);
        assertThat(orderService.customerCancelOrder(order.getId(), "Verified full refund").status()).isEqualTo(OrderStatus.CANCELLED);
    }

    @Test void customerCancellationRefundsBeforeCancellingAndIsIdempotent() {
        momo.create(order.getId(), customer.getEmail(), null);
        momo.processIpn(result("0"));
        when(gateway.refund(anyString(), anyString(), any(), anyString()))
                .thenReturn(Map.of("resultCode", "0", "transId", "987654321"));
        authenticate(customer);
        assertThat(orderService.getMyOrderDetail(order.getId()).canCustomerCancel()).isTrue();
        assertThat(orderService.customerCancelOrder(order.getId(), "Đổi mẫu").status()).isEqualTo(OrderStatus.CANCELLED);
        assertThat(reload().isPaid()).isTrue();
        assertThat(attempt().getRefundState()).isEqualTo(RefundState.SUCCEEDED);
        assertThat(attempt().getRefundCreateBy()).isEqualTo("customer" + customer.getId());
        assertThat(orderService.customerCancelOrder(order.getId(), "Đổi mẫu").status()).isEqualTo(OrderStatus.CANCELLED);
        verify(gateway, times(1)).refund(anyString(), eq("123456789"), eq(new BigDecimal("100000.00")), eq("Đổi mẫu"));
    }

    @Test void customerPendingRefundKeepsOrderAndReusesReferenceUntilVerified() {
        momo.create(order.getId(), customer.getEmail(), null);
        momo.processIpn(result("0"));
        when(gateway.refund(anyString(), anyString(), any(), anyString())).thenThrow(new PaymentProviderException());
        authenticate(customer);
        assertThat(orderService.customerCancelOrder(order.getId(), "Cancel").status()).isEqualTo(OrderStatus.PENDING_CONFIRMATION);
        String reference = attempt().getRefundRequestId();
        assertThat(attempt().getRefundState()).isEqualTo(RefundState.PENDING);
        authenticate(admin);
        assertThatThrownBy(() -> orderService.confirmOrder(order.getId())).isInstanceOf(IllegalStateException.class);
        when(gateway.refund(eq(reference), anyString(), any(), anyString()))
                .thenReturn(Map.of("resultCode", "0", "transId", "987654321"));
        payments.reconcileRefund(order.getId(), admin.getEmail(), "127.0.0.1");
        assertThat(reload().getStatus()).isEqualTo(OrderStatus.CANCELLED);
        verify(gateway, times(2)).refund(eq(reference), anyString(), any(), eq("Cancel"));
    }

    @Test void failedOrMalformedRefundNeverCancelsAndOwnerMayRetryFinalFailure() {
        momo.create(order.getId(), customer.getEmail(), null);
        momo.processIpn(result("0"));
        authenticate(customer);
        when(gateway.refund(anyString(), anyString(), any(), anyString()))
                .thenReturn(Map.of("resultCode", "1088"));
        assertThat(orderService.customerCancelOrder(order.getId(), null).status()).isEqualTo(OrderStatus.PENDING_CONFIRMATION);
        assertThat(attempt().getRefundState()).isEqualTo(RefundState.FAILED);
        String failedReference = attempt().getRefundRequestId();
        when(gateway.refund(anyString(), anyString(), any(), anyString()))
                .thenReturn(Map.of("resultCode", "0", "transId", "0"));
        assertThatThrownBy(() -> orderService.customerCancelOrder(order.getId(), null)).isInstanceOf(PaymentProviderException.class);
        assertThat(reload().getStatus()).isEqualTo(OrderStatus.PENDING_CONFIRMATION);
        assertThat(attempt().getRefundState()).isEqualTo(RefundState.PENDING);
        assertThat(attempt().getRefundRequestId()).isNotEqualTo(failedReference);
    }

    @Test void customerRefundRequiresOwnershipCustomerRoleAndPendingStatus() {
        momo.create(order.getId(), customer.getEmail(), null);
        momo.processIpn(result("0"));
        assertThatThrownBy(() -> momo.refundCustomerCancellation(order.getId(), "x", admin.getEmail()))
                .isInstanceOf(org.springframework.security.access.AccessDeniedException.class);
        order = reload(); order.setStatus(OrderStatus.CONFIRMED); orders.saveAndFlush(order);
        assertThatThrownBy(() -> momo.refundCustomerCancellation(order.getId(), "x", customer.getEmail()))
                .isInstanceOf(org.springframework.security.access.AccessDeniedException.class);
        verify(gateway, never()).refund(anyString(), anyString(), any(), anyString());
    }

    @Test void concurrentCancellationUsesOneRefundReferenceAndCancelsOnce() throws Exception {
        momo.create(order.getId(), customer.getEmail(), null);
        momo.processIpn(result("0"));
        var entered = new CountDownLatch(2);
        when(gateway.refund(anyString(), anyString(), any(), anyString())).thenAnswer(invocation -> {
            entered.countDown();
            assertThat(entered.await(10, TimeUnit.SECONDS)).isTrue();
            return Map.of("resultCode", "0", "transId", "987654321");
        });
        try (var executor = Executors.newFixedThreadPool(2)) {
            var first = executor.submit(() -> { authenticate(customer); try { return orderService.customerCancelOrder(order.getId(), "Concurrent"); } finally { SecurityContextHolder.clearContext(); } });
            var second = executor.submit(() -> { authenticate(customer); try { return orderService.customerCancelOrder(order.getId(), "Concurrent"); } finally { SecurityContextHolder.clearContext(); } });
            assertThat(first.get(20, TimeUnit.SECONDS).status()).isEqualTo(OrderStatus.CANCELLED);
            assertThat(second.get(20, TimeUnit.SECONDS).status()).isEqualTo(OrderStatus.CANCELLED);
        }
        String reference = attempt().getRefundRequestId();
        verify(gateway, times(2)).refund(eq(reference), anyString(), any(), eq("Concurrent"));
        assertThat(reload().getNotes().split("Khách hàng tự hủy", -1)).hasSize(2);
    }

    @Test void reconciliationUsesProviderResultAndFinalFailureAllowsNewAttempt() {
        momo.create(order.getId(), customer.getEmail(), null);
        when(gateway.query(anyString(), any())).thenReturn(result("1006"));
        assertThat(payments.reconcilePayment(order.getId(), customer.getEmail(), "127.0.0.1").status()).isEqualTo("FAILED");
        String old = attempt().getTransactionReference();
        assertThat(momo.create(order.getId(), customer.getEmail(), null).transactionReference()).isNotEqualTo(old);
    }

    @Test void invalidAmountIsRejectedBeforeAttemptCreation() {
        momo.validateAmount(new BigDecimal("1000"));
        momo.validateAmount(new BigDecimal("10000000"));
        assertThatThrownBy(() -> momo.validateAmount(new BigDecimal("999"))).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> momo.validateAmount(new BigDecimal("1000.01"))).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> momo.validateAmount(new BigDecimal("10000001"))).isInstanceOf(IllegalArgumentException.class);
        order.setFinalAmount(new BigDecimal("10000001"));
        orders.saveAndFlush(order);
        assertThatThrownBy(() -> momo.create(order.getId(), customer.getEmail(), null)).isInstanceOf(IllegalArgumentException.class);
        assertThat(attempts.findFirstByOrderIdOrderByIdDesc(order.getId())).isEmpty();
        verifyNoInteractions(gateway);
    }

    @Test void overflowingProviderTransactionIdCannotAuthorizePayment() {
        momo.create(order.getId(), customer.getEmail(), null);
        var invalid = result("0"); invalid.put("transId", "9999999999999999999");
        assertThatThrownBy(() -> momo.processIpn(invalid)).isInstanceOf(PaymentProviderException.class);
        assertThat(reload().isPaid()).isFalse();
        assertThat(attempt().getState()).isEqualTo(PaymentState.PENDING);
    }

    @Test void ipnHttpAcceptsNumericSignedFieldsAndOptionalNestedOrNullProviderData() throws Exception {
        momo.create(order.getId(), customer.getEmail(), null);
        var body = signedHttpResult("0", "qr", 123456789L);
        useRealIpnVerification();
        body.put("paymentOption", null);
        body.put("promotionInfo", List.of(Map.of("amount", 1000, "voucherId", "provider-promotion")));
        var http = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        var json = new ObjectMapper();
        http.perform(post("/api/v1/payments/momo/ipn").contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(body)))
                .andExpect(status().isNoContent());
        body.put("promotionInfo", null);
        http.perform(post("/api/v1/payments/momo/ipn").contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(body)))
                .andExpect(status().isNoContent());
        assertThat(reload().isPaid()).isTrue();
        assertThat(reload().getStatus()).isEqualTo(OrderStatus.PENDING_CONFIRMATION);
    }

    @Test void ipnHttpRejectsMissingSignedFieldsAndInvalidSignatureWithoutPaymentMutation() throws Exception {
        momo.create(order.getId(), customer.getEmail(), null);
        var body = signedHttpResult("0", "qr", 123456789L);
        useRealIpnVerification();
        body.remove("message");
        var http = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        var json = new ObjectMapper();
        http.perform(post("/api/v1/payments/momo/ipn").contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(body)))
                .andExpect(status().isBadRequest());
        body.put("message", "Success");
        body.put("signature", "a".repeat(64));
        http.perform(post("/api/v1/payments/momo/ipn").contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(body)))
                .andExpect(status().isBadRequest());
        assertThat(reload().isPaid()).isFalse();
        assertThat(attempt().getState()).isEqualTo(PaymentState.PENDING);
    }

    @Test void verifiedFinalCreateFailureAllowsRetryButNonFinalRejectionStaysPending() {
        doThrow(new MomoCreateRejectedException("98")).when(gateway).create(anyString(), any(), anyLong(), anyString(), anyString());
        assertThatThrownBy(() -> momo.create(order.getId(), customer.getEmail(), null)).isInstanceOf(IllegalStateException.class);
        assertThat(attempt().getState()).isEqualTo(PaymentState.FAILED);
        assertThat(momo.status(order.getId(), customer.getEmail()).canPay()).isTrue();
        String old = attempt().getTransactionReference();
        doThrow(new MomoCreateRejectedException("40")).when(gateway).create(anyString(), any(), anyLong(), anyString(), anyString());
        assertThatThrownBy(() -> momo.create(order.getId(), customer.getEmail(), null)).isInstanceOf(PaymentProviderException.class);
        assertThat(attempt().getTransactionReference()).isNotEqualTo(old);
        assertThat(attempt().getState()).isEqualTo(PaymentState.PENDING);
        assertThat(momo.status(order.getId(), customer.getEmail()).canPay()).isFalse();
    }

    @Test void signedFinalFailureWithoutPaymentTypeIsAcknowledgedAndAllowsRetry() throws Exception {
        momo.create(order.getId(), customer.getEmail(), null);
        useRealIpnVerification();
        var body = signedHttpResult("1006", "", 0L);
        MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build()
                .perform(post("/api/v1/payments/momo/ipn").contentType(MediaType.APPLICATION_JSON)
                        .content(new ObjectMapper().writeValueAsString(body)))
                .andExpect(status().isNoContent());
        assertThat(attempt().getState()).isEqualTo(PaymentState.FAILED);
        assertThat(reload().isPaid()).isFalse();
        assertThat(momo.status(order.getId(), customer.getEmail()).canPay()).isTrue();
    }

    private void useRealIpnVerification() {
        var verifier = new MomoGatewayImpl(new MomoProperties(true, "MOMO_TEST", "test-access", "test-only-private-secret",
                "https://m4n.test/payment-return", "https://m4n.test/api/v1/payments/momo/ipn", "http://localhost:5173,https://m4n.test"));
        when(gateway.verifyIpn(anyMap())).thenAnswer(call -> verifier.verifyIpn(call.getArgument(0)));
    }

    private Map<String, Object> signedHttpResult(String code, String payType, long transactionId) throws Exception {
        var body = new HashMap<String, Object>(result(code));
        body.put("amount", 100000L); body.put("resultCode", Integer.parseInt(code)); body.put("transId", transactionId);
        body.put("responseTime", 1721725424433L);
        body.put("orderType", "momo_wallet"); body.put("payType", payType); body.put("message", "Success");
        String canonical = "accessKey=test-access&amount=100000&extraData=&message=Success&orderId=" + body.get("orderId")
                + "&orderInfo=Thanh toan don hang " + order.getId() + "&orderType=momo_wallet&partnerCode=MOMO_TEST&payType=" + payType
                + "&requestId=" + body.get("requestId") + "&responseTime=1721725424433&resultCode=" + code + "&transId=" + transactionId;
        var mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec("test-only-private-secret".getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        body.put("signature", HexFormat.of().formatHex(mac.doFinal(canonical.getBytes(StandardCharsets.UTF_8))));
        return body;
    }

    @AfterEach void clearAuthentication() { SecurityContextHolder.clearContext(); }
    private void authenticate(User user) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(user.getEmail(), "test", List.of()));
    }

    private PaymentAttempt attempt() { return attempts.findFirstByOrderIdOrderByIdDesc(order.getId()).orElseThrow(); }
    private Order reload() { return orders.findById(order.getId()).orElseThrow(); }
    private Map<String, String> result(String code) {
        var result = new HashMap<>(Map.of("orderId", attempt().getTransactionReference(), "requestId", attempt().getTransactionReference(),
                "amount", "100000", "partnerCode", "MOMO_TEST", "resultCode", code, "transId", "123456789",
                "extraData", "", "orderInfo", "Thanh toan don hang " + order.getId()));
        return result;
    }
}
