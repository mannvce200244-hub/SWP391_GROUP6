package com.m4n.backend.service;

import com.m4n.backend.dto.request.*;
import com.m4n.backend.entity.*;
import com.m4n.backend.exception.PaymentProviderException;
import com.m4n.backend.repository.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.http.MediaType;
import tools.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.util.*;
import java.util.concurrent.*;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {"m4n.payment.momo.enabled=true", "m4n.payment.momo.partner-code=MOMO_TEST",
        "m4n.payment.momo.access-key=test-access", "m4n.payment.momo.secret-key=test-only-private-secret",
        "m4n.payment.momo.redirect-url=https://m4n.test/payment-return",
        "m4n.cors.allowed-origins=http://localhost:5173,https://m4n.test",
        "m4n.payment.momo.ipn-url=https://m4n.test/api/v1/payments/momo/ipn"})
class PosMomoPaymentIntegrationTest {
    @Autowired PosMomoPaymentService service;
    @Autowired MomoPaymentService onlineMomo;
    @Autowired PosService pos;
    @Autowired PosCustomerRepository profiles;
    @Autowired PosMomoPaymentRepository payments;
    @Autowired ProductRepository products;
    @Autowired CategoryRepository categories;
    @Autowired InventoryRepository inventories;
    @Autowired InvoiceRepository invoices;
    @Autowired UserRepository users;
    @Autowired RoleRepository roles;
    @Autowired VoucherRepository vouchers;
    @Autowired WebApplicationContext context;
    @Autowired ObjectMapper json;
    @MockitoBean MomoGateway gateway;
    @MockitoBean PosInvoiceNotifier invoiceNotifier;
    @MockitoBean InvoicePdfService invoicePdfs;
    @Autowired PosInvoiceEmailService receiptEmails;
    Product product;
    User staff, other;
    String id;

    @BeforeEach void fixtures() {
        String suffix = UUID.randomUUID().toString().replace("-", "");
        id = "pos-" + suffix;
        staff = cashier("one-" + suffix); other = cashier("two-" + suffix);
        var category = categories.saveAndFlush(Category.builder().code("PM-" + suffix).name("POS MoMo test").build());
        product = products.saveAndFlush(Product.builder().code("PM-" + suffix).name("POS instrument")
                .price(BigDecimal.valueOf(100000)).category(category).build());
        inventories.saveAndFlush(Inventory.builder().product(product).quantity(5).build());
        when(gateway.createPos(anyString(), any(), anyString(), anyString())).thenReturn("https://test-payment.momo.vn/v2/gateway/pay?test=1");
        when(gateway.verifyIpn(anyMap())).thenReturn(true);
        when(gateway.refund(anyString(), anyString(), any(), anyString())).thenReturn(Map.of("resultCode", "0", "transId", "987654321"));
    }
    @AfterEach void clearAuth() { SecurityContextHolder.clearContext(); }

    @Test void creationDoesNotDeductStockOrCreateInvoiceAndRetryKeepsImmutableIntent() {
        long count = invoices.count();
        long customerCount = profiles.count();
        var first = service.create(request(null), staff.getEmail(), "http://localhost:5173");
        var changed = request(null); changed.sale().getItems().getFirst().setQuantity(3);
        assertThat(service.create(changed, staff.getEmail(), "https://m4n.test")).isEqualTo(first);
        assertThat(stock()).isEqualTo(5); assertThat(invoices.count()).isEqualTo(count);
        verify(gateway, times(1)).createPos(eq(id), eq(new BigDecimal("200000.00")), eq("buyer@example.test"), eq("http://localhost:5173/pos"));
        assertThat(profiles.count()).isEqualTo(customerCount);
        assertThat(first.status()).isEqualTo("PENDING"); assertThat(first.invoiceId()).isNull();
        assertThat(payments.findById(id).orElseThrow().getReceiptEmailQueuedAt()).isNull();
    }

    @Test void concurrentSignedCallbacksCreateOneInvoiceAndDeductOnce() throws Exception {
        create(); long count = invoices.count();
        var result = result("0"); var gate = new CountDownLatch(1);
        try (var pool = Executors.newFixedThreadPool(2)) {
            var a = pool.submit(() -> { gate.await(); onlineMomo.processIpn(result); return true; });
            var b = pool.submit(() -> { gate.await(); onlineMomo.processIpn(result); return true; });
            gate.countDown(); assertThat(a.get(20, TimeUnit.SECONDS) && b.get(20, TimeUnit.SECONDS)).isTrue();
        }
        var status = service.status(id, staff.getEmail());
        assertThat(status.invoiceId()).isNotNull(); assertThat(stock()).isEqualTo(3);
        assertThat(invoices.count()).isEqualTo(count + 1);
        var invoice = pos.getInvoiceById(status.invoiceId(), staff.getEmail());
        assertThat(invoice.getPosCustomerId()).isNotNull();
        assertThat(invoice.getPosCustomerId()).isEqualTo(profiles.findByPhone(request(null).sale().getCustomerPhone()).orElseThrow().getId());
        assertThat(invoice.getPaymentMethod()).isEqualTo("MOMO");
        assertThat(invoice.getAmountReceived()).isEqualByComparingTo("200000");
        assertThat(payments.findById(id).orElseThrow().getReceiptEmailQueuedAt()).isNotNull();
        verify(gateway, never()).refund(anyString(), anyString(), any(), anyString());
    }

    @Test void competingPaidBillsNeverOversellAndRefundTheRejectedSale() throws Exception {
        setStock(2); create(); String first = id;
        id = "pos-" + UUID.randomUUID().toString().replace("-", ""); create(); String second = id;
        var one = result("0"); one.put("orderId", first); one.put("requestId", first); one.put("orderInfo", "Thanh toan POS " + first);
        var two = result("0"); long count = invoices.count(); var gate = new CountDownLatch(1);
        try (var pool = Executors.newFixedThreadPool(2)) {
            var a = pool.submit(() -> { gate.await(); service.processIpn(one); return true; });
            var b = pool.submit(() -> { gate.await(); service.processIpn(two); return true; });
            gate.countDown(); assertThat(a.get(20, TimeUnit.SECONDS) && b.get(20, TimeUnit.SECONDS)).isTrue();
        }
        var results = List.of(service.status(first, staff.getEmail()), service.status(second, staff.getEmail()));
        assertThat(results.stream().filter(p -> p.invoiceId() != null).count()).isEqualTo(1);
        assertThat(results.stream().filter(p -> "SUCCEEDED".equals(p.refundStatus())).count()).isEqualTo(1);
        assertThat(stock()).isZero(); assertThat(invoices.count()).isEqualTo(count + 1);
    }

    @Test void signedFailureAndUnknownResultsNeverProduceInvoice() {
        create(); service.processIpn(result("7000"));
        assertThat(service.status(id, staff.getEmail()).status()).isEqualTo("PENDING");
        service.processIpn(result("1006"));
        assertThat(service.status(id, staff.getEmail()).status()).isEqualTo("FAILED");
        assertThat(service.status(id, staff.getEmail()).invoiceId()).isNull(); assertThat(stock()).isEqualTo(5);
        assertThat(profiles.findByPhone(request(null).sale().getCustomerPhone())).isEmpty();
        assertThat(payments.findById(id).orElseThrow().getReceiptEmailQueuedAt()).isNull();
    }

    @Test void forgedSignatureAmountMerchantOrderInfoOrTransactionCannotSettle() {
        create(); when(gateway.verifyIpn(anyMap())).thenReturn(false);
        assertThatThrownBy(() -> service.processIpn(result("0"))).isInstanceOf(IllegalArgumentException.class);
        when(gateway.verifyIpn(anyMap())).thenReturn(true);
        for (var replacement : Map.of("amount", "1", "partnerCode", "FOREIGN", "transId", "0", "orderInfo", "online order", "requestId", "other").entrySet()) {
            var r = result("0"); r.put(replacement.getKey(), replacement.getValue());
            assertThatThrownBy(() -> service.processIpn(r)).isInstanceOf(RuntimeException.class);
        }
        assertThat(stock()).isEqualTo(5); assertThat(service.status(id, staff.getEmail()).status()).isEqualTo("PENDING");
    }

    @Test void insufficientStockAfterChargeAutomaticallyRefundsWithoutInvoiceOrDeduction() {
        create(); setStock(1); long count = invoices.count();
        service.processIpn(result("0")); service.processIpn(result("0"));
        var status = service.status(id, staff.getEmail());
        assertThat(status.status()).isEqualTo("SUCCEEDED"); assertThat(status.refundStatus()).isEqualTo("SUCCEEDED");
        assertThat(status.invoiceId()).isNull(); assertThat(invoices.count()).isEqualTo(count); assertThat(stock()).isEqualTo(1);
        assertThat(payments.findById(id).orElseThrow().getReceiptEmailQueuedAt()).isNull();
        verify(gateway, times(1)).refund(anyString(), eq("123456789"), eq(new BigDecimal("200000.00")), anyString());
    }

    @Test void timeoutOnRefundPersistsRequestAndRetryReusesItEvenAfterStockReturns() {
        create(); setStock(1);
        when(gateway.refund(anyString(), anyString(), any(), anyString())).thenThrow(new PaymentProviderException());
        service.processIpn(result("0"));
        String refundId = payments.findById(id).orElseThrow().getRefundReference();
        assertThat(service.status(id, staff.getEmail()).refundStatus()).isEqualTo("PENDING");
        setStock(5);
        when(gateway.refund(eq(refundId), anyString(), any(), anyString())).thenReturn(Map.of("resultCode", "0", "transId", "987654321"));
        var status = service.reconcile(id, staff.getEmail());
        assertThat(status.refundStatus()).isEqualTo("SUCCEEDED"); assertThat(status.invoiceId()).isNull(); assertThat(stock()).isEqualTo(5);
        verify(gateway, times(2)).refund(eq(refundId), anyString(), any(), anyString());
    }

    @Test void definitiveRefundFailureRequiresExplicitRetryAndNewRefundIdentifier() {
        create(); setStock(1);
        when(gateway.refund(anyString(), anyString(), any(), anyString())).thenReturn(Map.of("resultCode", "1080"));
        service.processIpn(result("0")); String failedId = payments.findById(id).orElseThrow().getRefundReference();
        service.processIpn(result("0"));
        verify(gateway, times(1)).refund(anyString(), anyString(), any(), anyString());
        assertThat(service.status(id, staff.getEmail()).refundStatus()).isEqualTo("FAILED");
        when(gateway.refund(anyString(), anyString(), any(), anyString())).thenReturn(Map.of("resultCode", "0", "transId", "987654321"));
        service.reconcile(id, staff.getEmail());
        assertThat(payments.findById(id).orElseThrow().getRefundReference()).isNotEqualTo(failedId);
        assertThat(service.status(id, staff.getEmail()).refundStatus()).isEqualTo("SUCCEEDED");
    }

    @Test void changedPriceRollsBackVoucherUsageStockAndInvoiceBeforeRefund() {
        String code = "PM-" + UUID.randomUUID().toString().replace("-", "");
        var voucher = vouchers.saveAndFlush(Voucher.builder().code(code).discountRate(new BigDecimal("0.10"))
                .minimumOrderValue(BigDecimal.ZERO).usageLimit(10).build());
        service.create(request(code), staff.getEmail(), null);
        assertThat(vouchers.findById(voucher.getId()).orElseThrow().getUsedCount()).isZero();
        product.setPrice(BigDecimal.valueOf(110000)); products.saveAndFlush(product);
        var result = result("0"); result.put("amount", "180000"); service.processIpn(result);
        assertThat(service.status(id, staff.getEmail()).refundStatus()).isEqualTo("SUCCEEDED");
        assertThat(service.status(id, staff.getEmail()).invoiceId()).isNull(); assertThat(stock()).isEqualTo(5);
        assertThat(vouchers.findById(voucher.getId()).orElseThrow().getUsedCount()).isZero();
    }

    @Test void createTimeoutCannotCreateAnotherProviderRequestOnRetry() {
        when(gateway.createPos(anyString(), any(), anyString(), anyString())).thenThrow(new PaymentProviderException());
        assertThatThrownBy(this::create).isInstanceOf(PaymentProviderException.class);
        assertThat(service.create(request(null), staff.getEmail(), null).paymentUrl()).isNull();
        verify(gateway, times(1)).createPos(anyString(), any(), anyString(), anyString());
        when(gateway.query(eq(id), any())).thenReturn(result("0"));
        assertThat(service.reconcile(id, staff.getEmail()).invoiceId()).isNotNull();
    }

    @Test void unknownOrExpiredPaymentNeverPermitsDuplicateOrClientDeclaredSuccess() {
        create(); var p = payments.findById(id).orElseThrow(); p.setExpiresAt(java.time.Instant.now().minusSeconds(1)); payments.saveAndFlush(p);
        assertThat(service.create(request(null), staff.getEmail(), null).paymentUrl()).isNull();
        when(gateway.query(eq(id), any())).thenThrow(new PaymentProviderException());
        assertThatThrownBy(() -> service.reconcile(id, staff.getEmail())).isInstanceOf(PaymentProviderException.class);
        assertThat(service.status(id, staff.getEmail()).invoiceId()).isNull(); assertThat(stock()).isEqualTo(5);
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(staff.getEmail(), "n/a", List.of()));
        assertThatThrownBy(() -> pos.finalizeSale(request(null).sale())).isInstanceOf(IllegalArgumentException.class);
    }

    @Test void backendEnforcesRoleOwnerValidationAndOriginBeforePayment() throws Exception {
        var mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        mvc.perform(post("/api/v1/pos/payments/momo").with(user(staff.getEmail()).roles("CUSTOMER"))
                .contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(request(null)))).andExpect(status().isForbidden());
        var bad = new PosMomoPaymentRequest(id, request(null).sale(), "bad", BigDecimal.valueOf(200000));
        mvc.perform(post("/api/v1/pos/payments/momo").with(user(staff.getEmail()).roles("POS_STAFF"))
                .contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(bad))).andExpect(status().isBadRequest());
        assertThatThrownBy(() -> service.create(request(null), staff.getEmail(), "https://evil.test")).isInstanceOf(IllegalArgumentException.class);
        assertThat(payments.findById(id)).isEmpty(); create();
        assertThatThrownBy(() -> service.status(id, other.getEmail())).isInstanceOf(org.springframework.security.access.AccessDeniedException.class);
        assertThatThrownBy(() -> service.reconcile(id, other.getEmail())).isInstanceOf(org.springframework.security.access.AccessDeniedException.class);
        assertThatThrownBy(() -> service.create(request(null), other.getEmail(), null)).isInstanceOf(org.springframework.security.access.AccessDeniedException.class);
        assertThat(service.recent(other.getEmail(), 0).getContent()).isEmpty();
    }

    @Test void cancellationPreventsLateChargeFromProducingInvoiceAndRefundsExactlyOnce() {
        create(); long count = invoices.count();
        when(gateway.query(eq(id), any())).thenReturn(result("7000"));
        var cancelled = service.cancel(id, staff.getEmail());
        assertThat(cancelled.cancelRequested()).isTrue();
        assertThat(cancelled.status()).isEqualTo("PENDING"); assertThat(cancelled.paymentUrl()).isNull();
        assertThat(stock()).isEqualTo(5); assertThat(invoices.count()).isEqualTo(count);
        service.processIpn(result("0")); service.processIpn(result("0"));
        var after = service.status(id, staff.getEmail());
        assertThat(after.invoiceId()).isNull(); assertThat(after.refundStatus()).isEqualTo("SUCCEEDED");
        assertThat(payments.findById(id).orElseThrow().getReceiptEmailQueuedAt()).isNull();
        assertThat(stock()).isEqualTo(5); assertThat(invoices.count()).isEqualTo(count);
        verify(gateway, times(1)).refund(anyString(), eq("123456789"), any(), anyString());
    }

    @Test void cancellationOfAlreadyRecordedChargeRefundsWithoutSettling() {
        create(); long count = invoices.count();
        var charged = payments.findById(id).orElseThrow();
        charged.setState(PaymentState.SUCCEEDED); charged.setTransactionNo("123456789");
        payments.saveAndFlush(charged);
        var cancelled = service.cancel(id, staff.getEmail());
        assertThat(cancelled.cancelRequested()).isTrue(); assertThat(cancelled.refundStatus()).isEqualTo("SUCCEEDED");
        assertThat(cancelled.invoiceId()).isNull(); assertThat(stock()).isEqualTo(5);
        assertThat(invoices.count()).isEqualTo(count);
        verify(gateway, never()).query(anyString(), any());
    }

    @Test void cancellationPersistsDuringQueryTimeoutAndUnknownRefundReusesRequest() {
        create(); when(gateway.query(eq(id), any())).thenThrow(new PaymentProviderException());
        assertThat(service.cancel(id, staff.getEmail()).cancelRequested()).isTrue();
        when(gateway.refund(anyString(), anyString(), any(), anyString())).thenThrow(new PaymentProviderException());
        service.processIpn(result("0"));
        String refundId = payments.findById(id).orElseThrow().getRefundReference();
        assertThat(service.status(id, staff.getEmail()).refundStatus()).isEqualTo("PENDING");
        when(gateway.refund(eq(refundId), anyString(), any(), anyString())).thenReturn(Map.of("resultCode", "0", "transId", "987654321"));
        assertThat(service.reconcile(id, staff.getEmail()).refundStatus()).isEqualTo("SUCCEEDED");
        verify(gateway, times(2)).refund(eq(refundId), anyString(), any(), anyString());
        assertThat(stock()).isEqualTo(5); assertThat(service.status(id, staff.getEmail()).invoiceId()).isNull();
    }

    @Test void cancellationCannotAlterAnAlreadyIssuedInvoice() {
        create(); service.processIpn(result("0"));
        Long invoice = service.status(id, staff.getEmail()).invoiceId();
        assertThatThrownBy(() -> service.cancel(id, staff.getEmail())).isInstanceOf(IllegalStateException.class);
        assertThat(service.status(id, staff.getEmail()).invoiceId()).isEqualTo(invoice);
        assertThat(service.status(id, staff.getEmail()).cancelRequested()).isFalse();
        assertThat(stock()).isEqualTo(3);
        verify(gateway, never()).refund(anyString(), anyString(), any(), anyString());
    }

    @Test void cancellationRequiresOwningCashierAndPosRole() throws Exception {
        create();
        assertThatThrownBy(() -> service.cancel(id, other.getEmail())).isInstanceOf(org.springframework.security.access.AccessDeniedException.class);
        var mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        mvc.perform(post("/api/v1/pos/payments/momo/" + id + "/cancel")
                .with(user(staff.getEmail()).roles("CUSTOMER"))).andExpect(status().isForbidden());
        assertThat(service.status(id, staff.getEmail()).cancelRequested()).isFalse();
        verify(gateway, never()).query(anyString(), any());
    }

    @Test void concurrentCancellationAndSettlementNeverRefundAnIssuedInvoice() throws Exception {
        create(); long count = invoices.count();
        when(gateway.query(eq(id), any())).thenReturn(result("7000"));
        var callback = result("0"); var gate = new CountDownLatch(1);
        try (var pool = Executors.newFixedThreadPool(2)) {
            var a = pool.submit(() -> { gate.await(); try { service.cancel(id, staff.getEmail()); return true; }
                catch (IllegalStateException alreadyIssued) { return false; } });
            var b = pool.submit(() -> { gate.await(); service.processIpn(callback); return true; });
            gate.countDown(); a.get(20, TimeUnit.SECONDS); assertThat(b.get(20, TimeUnit.SECONDS)).isTrue();
        }
        var after = service.status(id, staff.getEmail());
        if (after.cancelRequested()) {
            assertThat(after.invoiceId()).isNull(); assertThat(after.refundStatus()).isEqualTo("SUCCEEDED");
            assertThat(stock()).isEqualTo(5); assertThat(invoices.count()).isEqualTo(count);
        } else {
            assertThat(after.invoiceId()).isNotNull(); assertThat(after.refundStatus()).isEqualTo("NONE");
            assertThat(stock()).isEqualTo(3); assertThat(invoices.count()).isEqualTo(count + 1);
            verify(gateway, never()).refund(anyString(), anyString(), any(), anyString());
        }
    }

    @Test void receiptIsSentAfterCommitToPersistedCustomerWithTheCorrectPdfAndNotRepeated() throws Exception {
        create(); service.processIpn(result("0"));
        var payment = payments.findById(id).orElseThrow();
        var queued = payment.getReceiptEmailQueuedAt();
        Long invoiceId = service.status(id, staff.getEmail()).invoiceId();
        String code = invoices.findById(invoiceId).orElseThrow().getInvoiceCode();
        byte[] pdf = "%PDF-fixture".getBytes(java.nio.charset.StandardCharsets.UTF_8);
        when(invoiceNotifier.isAvailable()).thenReturn(true);
        when(invoicePdfs.generateInvoicePdf(anyLong())).thenReturn(pdf);
        doAnswer(call -> {
            assertThat(org.springframework.transaction.support.TransactionSynchronizationManager.isActualTransactionActive()).isFalse();
            assertThat(invoices.findById(invoiceId)).isPresent();
            return null;
        }).when(invoiceNotifier).sendInvoice(eq("buyer@example.test"), eq(code), any(), any());
        var gate = new CountDownLatch(1);
        try (var pool = Executors.newFixedThreadPool(2)) {
            var a = pool.submit(() -> { gate.await(); for (int i = 0; i < 5; i++) receiptEmails.deliverPending(); return true; });
            var b = pool.submit(() -> { gate.await(); for (int i = 0; i < 5; i++) receiptEmails.deliverPending(); return true; });
            gate.countDown(); assertThat(a.get(20, TimeUnit.SECONDS) && b.get(20, TimeUnit.SECONDS)).isTrue();
        }
        service.processIpn(result("0")); receiptEmails.deliverPending();
        verify(invoiceNotifier, times(1)).sendInvoice(eq("buyer@example.test"), eq(code), eq(new BigDecimal("200000.00")), eq(pdf));
        verify(invoicePdfs, times(1)).generateInvoicePdf(invoiceId);
        assertThat(payments.findById(id).orElseThrow().getReceiptEmailSentAt()).isNotNull();
        assertThat(payments.findById(id).orElseThrow().getReceiptEmailQueuedAt()).isEqualTo(queued);
        assertThat(stock()).isEqualTo(3);
    }

    @Test void smtpFailureLeavesInvoiceAndStockIntactAndRetriesDurablyAfterBackoff() {
        create(); service.processIpn(result("0"));
        Long invoiceId = service.status(id, staff.getEmail()).invoiceId();
        String code = invoices.findById(invoiceId).orElseThrow().getInvoiceCode();
        when(invoiceNotifier.isAvailable()).thenReturn(true);
        when(invoicePdfs.generateInvoicePdf(anyLong())).thenReturn(new byte[]{1, 2});
        doThrow(new IllegalStateException("fixture SMTP failure")).when(invoiceNotifier).sendInvoice(anyString(), eq(code), any(), any());
        for (int i = 0; i < 5; i++) receiptEmails.deliverPending();
        var failed = payments.findById(id).orElseThrow();
        assertThat(failed.getReceiptEmailSentAt()).isNull();
        assertThat(failed.getReceiptEmailAttemptedAt()).isNotNull();
        assertThat(service.status(id, staff.getEmail()).invoiceId()).isEqualTo(invoiceId);
        assertThat(stock()).isEqualTo(3);
        verify(invoiceNotifier, times(1)).sendInvoice(anyString(), eq(code), any(), any());
        failed.setReceiptEmailAttemptedAt(java.time.Instant.now().minusSeconds(301)); payments.saveAndFlush(failed);
        doNothing().when(invoiceNotifier).sendInvoice(anyString(), eq(code), any(), any());
        receiptEmails.deliverPending();
        assertThat(payments.findById(id).orElseThrow().getReceiptEmailSentAt()).isNotNull();
        verify(invoiceNotifier, times(2)).sendInvoice(anyString(), eq(code), any(), any());
        verify(gateway, never()).refund(anyString(), anyString(), any(), anyString());
    }

    @Test void verifiedMomoLinksSelectedOnlineCustomerWithoutCreatingShowroomProfile() {
        var request = request(null);
        String phone = request.sale().getCustomerPhone();
        var customer = users.saveAndFlush(User.builder().email(id + "@example.test").password("fixture-only")
                .fullName("Selected online buyer").phone(phone).role(roles.findByName(RoleName.CUSTOMER).orElseThrow()).build());
        request.sale().setCustomerId(customer.getId());
        service.create(request, staff.getEmail(), "http://localhost:5173");
        service.processIpn(result("0")); service.processIpn(result("0"));
        var invoice = pos.getInvoiceById(service.status(id, staff.getEmail()).invoiceId(), staff.getEmail());
        assertThat(invoice.getCustomerId()).isEqualTo(customer.getId());
        assertThat(invoice.getPosCustomerId()).isNull();
        assertThat(invoice.getCustomerName()).isEqualTo("Selected online buyer");
        assertThat(profiles.findByPhone(phone)).isEmpty();
        assertThat(stock()).isEqualTo(3);
    }

    @Test void verifiedMomoReusesExplicitlySelectedShowroomProfile() {
        var request = request(null);
        var profile = profiles.saveAndFlush(PosCustomer.builder().fullName("Showroom buyer")
                .phone(request.sale().getCustomerPhone()).createdAt(java.time.Instant.now()).build());
        request.sale().setPosCustomerId(profile.getId());
        service.create(request, staff.getEmail(), "http://localhost:5173");
        service.processIpn(result("0"));
        var invoice = pos.getInvoiceById(service.status(id, staff.getEmail()).invoiceId(), staff.getEmail());
        assertThat(invoice.getPosCustomerId()).isEqualTo(profile.getId());
        assertThat(invoice.getCustomerId()).isNull();
        assertThat(invoice.getCustomerName()).isEqualTo("Showroom buyer");
    }

    @Test void invalidCustomerFailsBeforeAllocatingOrCallingGateway() {
        var request = request(null); request.sale().setCustomerPhone(null);
        assertThatThrownBy(() -> service.create(request, staff.getEmail(), "http://localhost:5173"))
                .isInstanceOf(IllegalArgumentException.class);
        assertThat(payments.findById(id)).isEmpty();
        verify(gateway, never()).createPos(anyString(), any(), anyString(), anyString());
    }

    @Test void legacyNameOnlyPersistedIntentCompletesAsGuest() {
        create();
        var payment = payments.findById(id).orElseThrow();
        var legacy = request(null).sale(); legacy.setCustomerPhone(null);
        payment.setBill(json.writeValueAsString(legacy)); payments.saveAndFlush(payment);
        service.processIpn(result("0"));
        var invoice = pos.getInvoiceById(service.status(id, staff.getEmail()).invoiceId(), staff.getEmail());
        assertThat(invoice.getCustomerName()).isEqualTo("Test buyer");
        assertThat(invoice.getCustomerId()).isNull(); assertThat(invoice.getPosCustomerId()).isNull();
        assertThat(stock()).isEqualTo(3);
        verify(gateway, never()).refund(anyString(), anyString(), any(), anyString());
    }

    private User cashier(String suffix) {
        return users.saveAndFlush(User.builder().email("pos-momo-" + suffix + "@example.test").password("fixture-only")
                .fullName("POS fixture").role(roles.findByName(RoleName.POS_STAFF).orElseThrow()).isActive(true).build());
    }
    private PosMomoPaymentRequest request(String voucher) {
        var sale = PosSaleRequest.builder().items(List.of(PosSaleItemRequest.builder().productId(product.getId()).quantity(2).build()))
                .paymentMethod("MOMO").customerName("Test buyer").customerPhone("09" + String.format("%08d", Integer.toUnsignedLong(id.hashCode()) % 100000000)).voucherCode(voucher).build();
        return new PosMomoPaymentRequest(id, sale, "buyer@example.test", BigDecimal.valueOf(voucher == null ? 200000 : 180000));
    }
    private void create() { service.create(request(null), staff.getEmail(), "http://localhost:5173"); }
    private int stock() { return inventories.findByProductId(product.getId()).orElseThrow().getQuantity(); }
    private void setStock(int count) { var i = inventories.findByProductId(product.getId()).orElseThrow(); i.setQuantity(count); inventories.saveAndFlush(i); }
    private Map<String, String> result(String code) {
        var result = new HashMap<>(Map.of("orderId", id, "requestId", id, "partnerCode", "MOMO_TEST", "amount", "200000",
                "extraData", "", "orderInfo", "Thanh toan POS " + id, "resultCode", code, "transId", "123456789"));
        return result;
    }
}
