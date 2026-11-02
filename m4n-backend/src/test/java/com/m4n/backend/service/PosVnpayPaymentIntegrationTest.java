package com.m4n.backend.service;

import com.m4n.backend.dto.request.PosSaleItemRequest;
import com.m4n.backend.dto.request.PosSaleRequest;
import com.m4n.backend.dto.request.PosVnpayPaymentRequest;
import com.m4n.backend.entity.Category;
import com.m4n.backend.entity.Inventory;
import com.m4n.backend.entity.Product;
import com.m4n.backend.entity.RoleName;
import com.m4n.backend.entity.User;
import com.m4n.backend.exception.PaymentProviderException;
import com.m4n.backend.repository.CategoryRepository;
import com.m4n.backend.repository.InventoryRepository;
import com.m4n.backend.repository.InvoiceRepository;
import com.m4n.backend.repository.PosMomoPaymentRepository;
import com.m4n.backend.repository.ProductRepository;
import com.m4n.backend.repository.RoleRepository;
import com.m4n.backend.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.context.WebApplicationContext;
import tools.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "m4n.payment.vnpay.enabled=true",
        "m4n.payment.vnpay.merchant-code=TEST1234",
        "m4n.payment.vnpay.hash-secret=test-only-private-secret",
        "m4n.payment.vnpay.return-url=https://m4n.test/payment-return",
        "m4n.payment.vnpay.ipn-url=https://m4n.test/api/v1/payments/vnpay/ipn",
        "m4n.payment.vnpay.server-ip=127.0.0.1",
        "m4n.cors.allowed-origins=http://localhost:5173,https://m4n.test"
})
class PosVnpayPaymentIntegrationTest {
    @Autowired PosVnpayPaymentService service;
    @Autowired PaymentService onlinePayments;
    @Autowired PosService pos;
    @Autowired PosMomoPaymentRepository payments;
    @Autowired ProductRepository products;
    @Autowired CategoryRepository categories;
    @Autowired InventoryRepository inventories;
    @Autowired InvoiceRepository invoices;
    @Autowired UserRepository users;
    @Autowired RoleRepository roles;
    @Autowired WebApplicationContext context;
    @Autowired ObjectMapper json;
    @MockitoBean VnpayGateway gateway;

    Product product;
    User staff;
    User other;
    String id;

    @BeforeEach
    void setUp() {
        String suffix = UUID.randomUUID().toString().replace("-", "");
        id = "pos-" + suffix;
        staff = cashier("one-" + suffix);
        other = cashier("two-" + suffix);
        Category category = categories.saveAndFlush(Category.builder().code("PV-" + suffix).name("POS VNPay test").build());
        product = products.saveAndFlush(Product.builder()
                .code("PV-" + suffix)
                .name("Đàn Tranh Cao Cấp")
                .price(BigDecimal.valueOf(7_500_000))
                .category(category)
                .build());
        inventories.saveAndFlush(Inventory.builder().product(product).quantity(5).build());
        when(gateway.paymentUrl(anyMap())).thenReturn("https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_BankCode=NCB");
        when(gateway.verifyIpn(anyMap())).thenReturn(true);
        when(gateway.refund(anyMap())).thenAnswer(invocation -> {
            @SuppressWarnings("unchecked")
            Map<String, String> req = invocation.getArgument(0, Map.class);
            return Map.of(
                    "vnp_Command", "refund",
                    "vnp_ResponseId", "RefundResp123",
                    "vnp_ResponseCode", "00",
                    "vnp_TransactionType", "02",
                    "vnp_TransactionStatus", "00",
                    "vnp_TransactionNo", "987654",
                    "vnp_TmnCode", "TEST1234",
                    "vnp_TxnRef", req.get("vnp_TxnRef"),
                    "vnp_Amount", req.get("vnp_Amount"));
        });
    }

    @AfterEach
    void clearSecurity() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @SuppressWarnings("unchecked")
    void creationSupportsHighValueShowroomTotalDirectNcbAndOptionalEmailWithoutDeductingStock() {
        long count = invoices.count();
        var created = service.create(request(null), staff.getEmail(), "::1", "http://localhost:5173");
        var retry = service.create(request("other@example.test"), staff.getEmail(), "127.0.0.1", "https://m4n.test");

        assertThat(retry).isEqualTo(created);
        assertThat(created.amount()).isEqualByComparingTo("15000000");
        assertThat(created.status()).isEqualTo("PENDING");
        assertThat(created.invoiceId()).isNull();
        assertThat(stock()).isEqualTo(5);
        assertThat(invoices.count()).isEqualTo(count);

        ArgumentCaptor<Map<String, String>> captor = ArgumentCaptor.forClass(Map.class);
        verify(gateway, times(1)).paymentUrl(captor.capture());
        assertThat(captor.getValue())
                .containsEntry("vnp_BankCode", "NCB")
                .containsEntry("vnp_Amount", "1500000000")
                .containsEntry("vnp_IpAddr", "127.0.0.1")
                .containsEntry("vnp_TxnRef", id)
                .containsEntry("vnp_ReturnUrl", "http://localhost:5173/pos?m4nPosPaymentId=" + id);
    }

    @Test
    void concurrentSignedVnpayCallbacksCreateOneVnpayInvoiceAndRespectOptionalReceiptEmail() throws Exception {
        service.create(request(null), staff.getEmail(), "127.0.0.1", "http://localhost:5173");
        long beforeCount = invoices.count();
        var callback = ipnMultiMap(ipnParams("00", "00"));
        var gate = new CountDownLatch(1);
        try (var pool = Executors.newFixedThreadPool(2)) {
            var a = pool.submit(() -> { gate.await(); return onlinePayments.processIpn(callback).rspCode(); });
            var b = pool.submit(() -> { gate.await(); return onlinePayments.processIpn(callback).rspCode(); });
            gate.countDown();
            assertThat(List.of(a.get(20, TimeUnit.SECONDS), b.get(20, TimeUnit.SECONDS)))
                    .containsExactlyInAnyOrder("00", "02");
        }
        var status = service.status(id, staff.getEmail());
        assertThat(status.invoiceId()).isNotNull();
        assertThat(stock()).isEqualTo(3);
        assertThat(invoices.count()).isEqualTo(beforeCount + 1);
        var invoice = pos.getInvoiceById(status.invoiceId(), staff.getEmail());
        assertThat(invoice.getPaymentMethod()).isEqualTo("VNPAY");
        assertThat(invoice.getFinalAmount()).isEqualByComparingTo("15000000");
        // Blank optional email does not enqueue SMTP delivery
        assertThat(payments.findById(id).orElseThrow().getReceiptEmailQueuedAt()).isNull();

        // With customer email supplied, receipt PDF email is queued atomically
        id = "pos-" + UUID.randomUUID().toString().replace("-", "");
        service.create(request("buyer@example.test"), staff.getEmail(), "127.0.0.1", "http://localhost:5173");
        assertThat(onlinePayments.processIpn(ipnMultiMap(ipnParams("00", "00"))).rspCode()).isEqualTo("00");
        assertThat(payments.findById(id).orElseThrow().getReceiptEmailQueuedAt()).isNotNull();
        verify(gateway, never()).refund(anyMap());
    }

    @Test
    void competingPaidVnpayBillsNeverOversellAndAutomaticallyRefundRejectedSale() throws Exception {
        setStock(2);
        service.create(request(null), staff.getEmail(), "127.0.0.1", null);
        String first = id;
        id = "pos-" + UUID.randomUUID().toString().replace("-", "");
        service.create(request(null), staff.getEmail(), "127.0.0.1", null);
        String second = id;

        var one = ipnParams("00", "00");
        one.put("vnp_TxnRef", first);
        one.put("vnp_OrderInfo", "Thanh toan POS " + first);
        var two = ipnParams("00", "00");

        long count = invoices.count();
        var gate = new CountDownLatch(1);
        try (var pool = Executors.newFixedThreadPool(2)) {
            var a = pool.submit(() -> { gate.await(); return service.processIpn(one).rspCode(); });
            var b = pool.submit(() -> { gate.await(); return service.processIpn(two).rspCode(); });
            gate.countDown();
            assertThat(a.get(20, TimeUnit.SECONDS)).isEqualTo("00");
            assertThat(b.get(20, TimeUnit.SECONDS)).isEqualTo("00");
        }
        var results = List.of(service.status(first, staff.getEmail()), service.status(second, staff.getEmail()));
        assertThat(results.stream().filter(p -> p.invoiceId() != null).count()).isEqualTo(1);
        assertThat(results.stream().filter(p -> "SUCCEEDED".equals(p.refundStatus())).count()).isEqualTo(1);
        assertThat(stock()).isZero();
        assertThat(invoices.count()).isEqualTo(count + 1);
    }

    @Test
    void userCancelMarksFailedAndForgedCallbacksOrDirectFinalizeCannotSettle() {
        service.create(request(null), staff.getEmail(), "127.0.0.1", null);

        when(gateway.verifyIpn(anyMap())).thenReturn(false);
        assertThat(onlinePayments.processIpn(ipnMultiMap(ipnParams("00", "00"))).rspCode()).isEqualTo("97");
        when(gateway.verifyIpn(anyMap())).thenReturn(true);

        var wrongAmount = ipnParams("00", "00");
        wrongAmount.put("vnp_Amount", "100");
        assertThat(onlinePayments.processIpn(ipnMultiMap(wrongAmount)).rspCode()).isEqualTo("04");

        var wrongOrderInfo = ipnParams("00", "00");
        wrongOrderInfo.put("vnp_OrderInfo", "Thanh toan don hang 1");
        assertThat(onlinePayments.processIpn(ipnMultiMap(wrongOrderInfo)).rspCode()).isEqualTo("99");

        // User cancelled on VNPay (code 24)
        var cancelled = ipnParams("24", "02");
        assertThat(onlinePayments.processIpn(ipnMultiMap(cancelled)).rspCode()).isEqualTo("00");
        assertThat(service.status(id, staff.getEmail()).status()).isEqualTo("FAILED");
        assertThat(service.status(id, staff.getEmail()).invoiceId()).isNull();
        assertThat(stock()).isEqualTo(5);

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(staff.getEmail(), "n/a", List.of()));
        assertThatThrownBy(() -> pos.finalizeSale(request(null).sale()))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void cashierCancellationAndReconcileGracefulDegradationAndAuthorization() throws Exception {
        var mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        mvc.perform(post("/api/v1/pos/payments/vnpay")
                        .with(user(staff.getEmail()).roles("CUSTOMER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(request(null))))
                .andExpect(status().isForbidden());

        assertThatThrownBy(() -> service.create(request(null), staff.getEmail(), "127.0.0.1", "https://evil.test"))
                .isInstanceOf(IllegalArgumentException.class);
        assertThat(payments.findById(id)).isEmpty();

        service.create(request(null), staff.getEmail(), "127.0.0.1", "http://localhost:5173");
        assertThatThrownBy(() -> service.status(id, other.getEmail())).isInstanceOf(AccessDeniedException.class);

        // When VNPay querydr is unavailable / no charge exists yet, reconcile returns safe PENDING status instead of 502
        when(gateway.query(anyMap())).thenThrow(new PaymentProviderException());
        var reconciledPending = service.reconcile(id, staff.getEmail());
        assertThat(reconciledPending.status()).isEqualTo("PENDING");
        assertThat(reconciledPending.paymentUrl()).isNotBlank();

        // Explicit cashier cancellation stops the bill and refunds late charges
        var cancelled = service.cancel(id, staff.getEmail());
        assertThat(cancelled.cancelRequested()).isTrue();
        assertThat(cancelled.paymentUrl()).isNull();
        assertThat(service.processIpn(ipnParams("00", "00")).rspCode()).isEqualTo("00");
        var afterLateCharge = service.status(id, staff.getEmail());
        assertThat(afterLateCharge.invoiceId()).isNull();
        assertThat(afterLateCharge.refundStatus()).isEqualTo("SUCCEEDED");
        assertThat(stock()).isEqualTo(5);
    }

    private User cashier(String suffix) {
        return users.saveAndFlush(User.builder()
                .email("pos-vnpay-" + suffix + "@example.test")
                .password("fixture-only")
                .fullName("POS VNPay fixture")
                .role(roles.findByName(RoleName.POS_STAFF).orElseThrow())
                .isActive(true)
                .build());
    }

    private PosVnpayPaymentRequest request(String customerEmail) {
        var sale = PosSaleRequest.builder()
                .items(List.of(PosSaleItemRequest.builder().productId(product.getId()).quantity(2).build()))
                .paymentMethod("VNPAY")
                .customerName("Khách POS VNPay")
                .customerPhone("09" + String.format("%08d", Integer.toUnsignedLong(id.hashCode()) % 100000000))
                .build();
        return new PosVnpayPaymentRequest(id, sale, customerEmail, BigDecimal.valueOf(15_000_000));
    }

    private int stock() {
        return inventories.findByProductId(product.getId()).orElseThrow().getQuantity();
    }

    private void setStock(int count) {
        var i = inventories.findByProductId(product.getId()).orElseThrow();
        i.setQuantity(count);
        inventories.saveAndFlush(i);
    }

    private Map<String, String> ipnParams(String responseCode, String txStatus) {
        return new HashMap<>(Map.of(
                "vnp_TmnCode", "TEST1234",
                "vnp_TxnRef", id,
                "vnp_OrderInfo", "Thanh toan POS " + id,
                "vnp_Amount", "1500000000",
                "vnp_CurrCode", "VND",
                "vnp_ResponseCode", responseCode,
                "vnp_TransactionStatus", txStatus,
                "vnp_TransactionNo", "12345678",
                "vnp_BankCode", "NCB",
                "vnp_PayDate", "20261030150000"));
    }

    private LinkedMultiValueMap<String, String> ipnMultiMap(Map<String, String> map) {
        var multi = new LinkedMultiValueMap<String, String>();
        map.forEach(multi::add);
        return multi;
    }
}

