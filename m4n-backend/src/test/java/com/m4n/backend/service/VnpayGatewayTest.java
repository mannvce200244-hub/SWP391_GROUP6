package com.m4n.backend.service;

import com.m4n.backend.config.VnpayProperties;
import com.m4n.backend.exception.PaymentProviderException;
import com.m4n.backend.service.serviceImpl.VnpayGatewayImpl;
import org.junit.jupiter.api.*;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.*;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

class VnpayGatewayTest {
    static final String SECRET = "unit-test-only-signing-secret";
    VnpayGateway gateway; MockRestServiceServer server;
    @BeforeEach void setup() {
        RestClient.Builder actual = RestClient.builder().baseUrl("https://sandbox.vnpayment.vn");
        server = MockRestServiceServer.bindTo(actual).build();
        RestClient.Builder wrapper = mock(RestClient.Builder.class, RETURNS_SELF);
        when(wrapper.build()).thenAnswer(inv -> actual.build());
        gateway = new VnpayGatewayImpl(new VnpayProperties(true, "TEST1234", SECRET,
                "https://m4n.test/payment-return", "https://m4n.test/ipn", "127.0.0.1"), wrapper);
    }
    @Test void signsSortedEncodedPaymentParametersAndRejectsTampering() throws Exception {
        Map<String, String> params = new HashMap<>(Map.of("vnp_TmnCode", "TEST1234", "vnp_Amount", "500000", "vnp_OrderInfo", "Thanh toan don hang 1"));
        String canonical = "vnp_Amount=500000&vnp_OrderInfo=Thanh+toan+don+hang+1&vnp_TmnCode=TEST1234";
        assertThat(gateway.paymentUrl(params)).isEqualTo("https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?" + canonical + "&vnp_SecureHash=" + sign(canonical));
        params.put("vnp_SecureHash", sign(canonical)); assertThat(gateway.verifyIpn(params)).isTrue();
        params.put("vnp_Amount", "1"); assertThat(gateway.verifyIpn(params)).isFalse();
    }
    @Test void verifiesRefundResponseSignatureBeforeReturningItsState() throws Exception {
        Map<String, String> response = refundResponse();
        response.put("vnp_SecureHash", sign("response1|refund|00|Accepted|TEST1234|txn1|500000|NCB|20261010230000|888|02|05|Hoan tien don hang"));
        server.expect(requestTo("https://sandbox.vnpayment.vn/merchant_webapi/api/transaction"))
                .andExpect(method(org.springframework.http.HttpMethod.POST))
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andRespond(withSuccess(new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(response), MediaType.APPLICATION_JSON));
        assertThat(gateway.refund(refundRequest())).containsEntry("vnp_TransactionStatus", "05"); server.verify();
    }
    @Test void invalidRefundSignatureCannotConfirmRefund() throws Exception {
        Map<String, String> response = refundResponse(); response.put("vnp_SecureHash", "0".repeat(128));
        server.expect(requestTo("https://sandbox.vnpayment.vn/merchant_webapi/api/transaction"))
                .andRespond(withSuccess(new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(response), MediaType.APPLICATION_JSON));
        assertThatThrownBy(() -> gateway.refund(refundRequest())).isInstanceOf(PaymentProviderException.class);
    }
    private Map<String, String> refundRequest() { Map<String, String> m = new HashMap<>();
        m.put("vnp_RequestId", "request1"); m.put("vnp_Version", "2.1.0"); m.put("vnp_Command", "refund"); m.put("vnp_TmnCode", "TEST1234");
        m.put("vnp_TransactionType", "02"); m.put("vnp_TxnRef", "txn1"); m.put("vnp_Amount", "500000"); m.put("vnp_TransactionNo", "123");
        m.put("vnp_TransactionDate", "20261010220000"); m.put("vnp_CreateBy", "admin1"); m.put("vnp_CreateDate", "20261010230000");
        m.put("vnp_IpAddr", "127.0.0.1"); m.put("vnp_OrderInfo", "Hoan tien don hang"); return m; }
    private Map<String, String> refundResponse() { Map<String, String> m = new HashMap<>();
        m.put("vnp_ResponseId", "response1"); m.put("vnp_Command", "refund"); m.put("vnp_ResponseCode", "00"); m.put("vnp_Message", "Accepted");
        m.put("vnp_TmnCode", "TEST1234"); m.put("vnp_TxnRef", "txn1"); m.put("vnp_Amount", "500000"); m.put("vnp_BankCode", "NCB");
        m.put("vnp_PayDate", "20261010230000"); m.put("vnp_TransactionNo", "888"); m.put("vnp_TransactionType", "02");
        m.put("vnp_TransactionStatus", "05"); m.put("vnp_OrderInfo", "Hoan tien don hang"); return m; }
    private String sign(String text) throws Exception { Mac mac = Mac.getInstance("HmacSHA512");
        mac.init(new SecretKeySpec(SECRET.getBytes(StandardCharsets.UTF_8), "HmacSHA512"));
        return HexFormat.of().formatHex(mac.doFinal(text.getBytes(StandardCharsets.UTF_8))); }
}
