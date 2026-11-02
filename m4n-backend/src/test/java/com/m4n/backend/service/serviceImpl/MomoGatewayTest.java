package com.m4n.backend.service.serviceImpl;
import com.m4n.backend.config.MomoProperties;
import com.m4n.backend.exception.PaymentProviderException;
import com.m4n.backend.exception.MomoCreateRejectedException;
import org.junit.jupiter.api.*;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;
import org.springframework.mock.http.client.MockClientHttpRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.math.BigDecimal;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

class MomoGatewayTest {
    MomoGatewayImpl gateway; MockRestServiceServer server;
    static final String SECRET = "test-only-private-secret";
    @BeforeEach void setup() {
        var builder = RestClient.builder().baseUrl("https://test-payment.momo.vn");
        server = MockRestServiceServer.bindTo(builder).build();
        gateway = new MomoGatewayImpl(new MomoProperties(true, "MOMO_TEST", "test-access", SECRET,
                "https://m4n.test/payment-return", "https://m4n.test/api/v1/payments/momo/ipn", "http://localhost:5173,https://m4n.test"), builder.build());
    }
    @Test void posCardCreationSignsBillIdentityAndReturnsToOriginalPosOrigin() throws Exception {
        String url = "https://test-payment.momo.vn/v2/gateway/pay?token=sample";
        var result = createResult(url);
        String signature = sign("accessKey=test-access&amount=100000&extraData=&ipnUrl=https://m4n.test/api/v1/payments/momo/ipn"
                + "&orderId=reference&orderInfo=Thanh toan POS reference&partnerCode=MOMO_TEST&redirectUrl=http://localhost:5173/pos?m4nPosPaymentId=reference"
                + "&requestId=reference&requestType=payWithCC");
        server.expect(requestTo("https://test-payment.momo.vn/v2/gateway/api/create"))
                .andExpect(jsonPath("$.signature").value(signature))
                .andExpect(jsonPath("$.requestType").value("payWithCC"))
                .andExpect(jsonPath("$.userInfo.email").value("buyer@example.test"))
                .andExpect(jsonPath("$.redirectUrl").value("http://localhost:5173/pos?m4nPosPaymentId=reference"))
                .andRespond(withSuccess(new ObjectMapper().writeValueAsString(result), MediaType.APPLICATION_JSON));
        assertThat(gateway.createPos("reference", BigDecimal.valueOf(100000), "buyer@example.test", "http://localhost:5173/pos")).isEqualTo(url);
        server.verify();
    }

    @Test void createSignsExactProviderContractAndAcceptsSignedOfficialRedirect() throws Exception {
        String url = "https://test-payment.momo.vn/v2/gateway/pay?token=sample";
        Map<String, Object> result = createResult(url);
        String requestSignature = sign("accessKey=test-access&amount=100000&extraData=&ipnUrl=https://m4n.test/api/v1/payments/momo/ipn"
                + "&orderId=reference&orderInfo=Thanh toan don hang 55&partnerCode=MOMO_TEST&redirectUrl=https://m4n.test/payment-return?m4nOrderId=55"
                + "&requestId=reference&requestType=payWithCC");
        server.expect(requestTo("https://test-payment.momo.vn/v2/gateway/api/create"))
                .andExpect(content().json("{\"signature\":\"" + requestSignature + "\",\"autoCapture\":true,\"amount\":100000}"))
                .andExpect(jsonPath("$.requestType").value("payWithCC"))
                .andExpect(jsonPath("$.userInfo.email").value("recipient@example.test"))
                .andRespond(withSuccess(new ObjectMapper().writeValueAsString(result), MediaType.APPLICATION_JSON));
        assertThat(gateway.create("reference", BigDecimal.valueOf(100000), 55L, "recipient@example.test", "https://m4n.test/payment-return")).isEqualTo(url);
        server.verify();
    }
    @Test void localhostReturnUrlIsIncludedInTheSignedCardRequest() throws Exception {
        String url = "https://test-payment.momo.vn/v2/gateway/pay?token=sample";
        String signature = sign("accessKey=test-access&amount=100000&extraData=&ipnUrl=https://m4n.test/api/v1/payments/momo/ipn"
                + "&orderId=reference&orderInfo=Thanh toan don hang 55&partnerCode=MOMO_TEST&redirectUrl=http://localhost:5173/payment-return?m4nOrderId=55"
                + "&requestId=reference&requestType=payWithCC");
        server.expect(requestTo("https://test-payment.momo.vn/v2/gateway/api/create"))
                .andExpect(jsonPath("$.redirectUrl").value("http://localhost:5173/payment-return?m4nOrderId=55"))
                .andExpect(jsonPath("$.signature").value(signature))
                .andRespond(withSuccess(new ObjectMapper().writeValueAsString(createResult(url)), MediaType.APPLICATION_JSON));
        assertThat(gateway.create("reference", BigDecimal.valueOf(100000), 55L, "recipient@example.test", "http://localhost:5173/payment-return")).isEqualTo(url);
        server.verify();
    }

    @Test void sandboxMayOmitCreateSignatureForBoundOfficialPendingUrl() throws Exception {
        String url = "https://test-payment.momo.vn/v2/gateway/pay?token=sample";
        var result = createResult(url);
        result.remove("signature");
        server.expect(anything()).andRespond(withSuccess(new ObjectMapper().writeValueAsString(result), MediaType.APPLICATION_JSON));
        assertThat(gateway.create("reference", BigDecimal.valueOf(100000), 55L, "recipient@example.test", "https://m4n.test/payment-return")).isEqualTo(url);
        server.verify();
    }
    @Test void unsignedCreateStillRejectsForeignIdentityAmountAndUnsafeUrls() throws Exception {
        for (var replacement : Map.<String, Object>of("partnerCode", "OTHER", "requestId", "foreign", "orderId", "foreign", "amount", 1).entrySet()) {
            var result = createResult("https://test-payment.momo.vn/v2/gateway/pay?token=sample");
            result.remove("signature");
            result.put(replacement.getKey(), replacement.getValue());
            server.expect(anything()).andRespond(withSuccess(new ObjectMapper().writeValueAsString(result), MediaType.APPLICATION_JSON));
            assertThatThrownBy(() -> gateway.create("reference", BigDecimal.valueOf(100000), 55L, "recipient@example.test", "https://m4n.test/payment-return")).isInstanceOf(PaymentProviderException.class);
            server.verify();
            server.reset();
        }
        for (String url : List.of("https://attacker.test/v2/gateway/pay", "http://test-payment.momo.vn/v2/gateway/pay",
                "https://test-payment.momo.vn/other", "https://test-payment.momo.vn@attacker.test/v2/gateway/pay")) {
            var result = createResult(url);
            result.remove("signature");
            server.expect(anything()).andRespond(withSuccess(new ObjectMapper().writeValueAsString(result), MediaType.APPLICATION_JSON));
            assertThatThrownBy(() -> gateway.create("reference", BigDecimal.valueOf(100000), 55L, "recipient@example.test", "https://m4n.test/payment-return")).isInstanceOf(PaymentProviderException.class);
            server.verify();
            server.reset();
        }
    }
    @Test void unsignedCreateRejectionCannotAuthorizeAnotherAttempt() throws Exception {
        var result = createResult("");
        result.remove("signature");
        result.put("resultCode", 98);
        server.expect(anything()).andRespond(withSuccess(new ObjectMapper().writeValueAsString(result), MediaType.APPLICATION_JSON));
        assertThatThrownBy(() -> gateway.create("reference", BigDecimal.valueOf(100000), 55L, "recipient@example.test", "https://m4n.test/payment-return"))
                .isExactlyInstanceOf(PaymentProviderException.class);
        server.verify();
    }
    @Test void forgedAndSignedForeignRedirectsAreRejected() throws Exception {
        var forged = createResult("https://test-payment.momo.vn/v2/gateway/pay?token=sample");
        forged.put("signature", "0".repeat(64));
        server.expect(anything()).andRespond(withSuccess(new ObjectMapper().writeValueAsString(forged), MediaType.APPLICATION_JSON));
        assertThatThrownBy(() -> gateway.create("reference", BigDecimal.valueOf(100000), 55L, "recipient@example.test", "https://m4n.test/payment-return")).isInstanceOf(PaymentProviderException.class);
        server.verify();
        server.reset();
        var foreign = createResult("https://attacker.test/v2/gateway/pay");
        server.expect(anything()).andRespond(withSuccess(new ObjectMapper().writeValueAsString(foreign), MediaType.APPLICATION_JSON));
        assertThatThrownBy(() -> gateway.create("reference", BigDecimal.valueOf(100000), 55L, "recipient@example.test", "https://m4n.test/payment-return")).isInstanceOf(PaymentProviderException.class);
    }
    @Test void signedIpnRejectsTamperedAmountMerchantAndMissingFields() throws Exception {
        Map<String, String> result = new HashMap<>(Map.of("amount", "100000", "extraData", "", "message", "Success", "orderId", "reference",
                "orderInfo", "Thanh toan don hang 55", "orderType", "momo_wallet", "partnerCode", "MOMO_TEST", "payType", "credit",
                "requestId", "reference", "responseTime", "1721725424433"));
        result.put("resultCode", "0"); result.put("transId", "123456789");
        result.put("signature", sign("accessKey=test-access&amount=100000&extraData=&message=Success&orderId=reference"
                + "&orderInfo=Thanh toan don hang 55&orderType=momo_wallet&partnerCode=MOMO_TEST&payType=credit&requestId=reference"
                + "&responseTime=1721725424433&resultCode=0&transId=123456789"));
        assertThat(gateway.verifyIpn(result)).isTrue();
        String signature = result.remove("signature"); assertThat(gateway.verifyIpn(result)).isFalse();
        result.put("signature", signature);
        result.put("amount", "1"); assertThat(gateway.verifyIpn(result)).isFalse();
        result.put("amount", "100000"); result.put("partnerCode", "OTHER"); assertThat(gateway.verifyIpn(result)).isFalse();
        result.put("partnerCode", "MOMO_TEST"); result.remove("payType"); assertThat(gateway.verifyIpn(result)).isFalse();
    }
    @Test void queryRejectsResponseForDifferentAmountOrReference() {
        server.expect(anything()).andRespond(withSuccess("{\"partnerCode\":\"MOMO_TEST\",\"orderId\":\"foreign\",\"requestId\":\"bad\",\"amount\":100000,\"resultCode\":0}", MediaType.APPLICATION_JSON));
        assertThatThrownBy(() -> gateway.query("reference", BigDecimal.valueOf(100000))).isInstanceOf(PaymentProviderException.class);
    }
    @Test void querySignsTheRequestAndAcceptsBoundProviderStatus() {
        server.expect(requestTo("https://test-payment.momo.vn/v2/gateway/api/query")).andRespond(request -> {
            var json = new ObjectMapper();
            var body = json.readTree(((MockClientHttpRequest) request).getBodyAsString());
            String requestId = body.get("requestId").asText();
            try {
                assertThat(body.get("signature").asText()).isEqualTo(sign("accessKey=test-access&orderId=reference&partnerCode=MOMO_TEST&requestId=" + requestId));
            } catch (Exception ex) { throw new AssertionError(ex); }
            return withSuccess(json.writeValueAsString(Map.of("partnerCode", "MOMO_TEST", "orderId", "reference",
                    "requestId", requestId, "amount", 100000, "resultCode", 0, "transId", 123456789)),
                    MediaType.APPLICATION_JSON).createResponse(request);
        });
        assertThat(gateway.query("reference", BigDecimal.valueOf(100000))).containsEntry("resultCode", "0");
        server.verify();
    }
    @Test void refundUsesPersistedRequestIdAndSignsOriginalTransactionAndAmount() throws Exception {
        String signature = sign("accessKey=test-access&amount=100000&description=Test refund&orderId=refund-reference"
                + "&partnerCode=MOMO_TEST&requestId=refund-reference&transId=123456789");
        server.expect(requestTo("https://test-payment.momo.vn/v2/gateway/api/refund"))
                .andExpect(content().json("{\"partnerCode\":\"MOMO_TEST\",\"orderId\":\"refund-reference\",\"requestId\":\"refund-reference\","
                        + "\"amount\":100000,\"transId\":123456789,\"description\":\"Test refund\",\"signature\":\"" + signature + "\"}"))
                .andRespond(withSuccess("{\"partnerCode\":\"MOMO_TEST\",\"orderId\":\"refund-reference\",\"requestId\":\"refund-reference\","
                        + "\"amount\":100000,\"resultCode\":0,\"transId\":987654321}", MediaType.APPLICATION_JSON));
        assertThat(gateway.refund("refund-reference", "123456789", BigDecimal.valueOf(100000), "Test refund"))
                .containsEntry("resultCode", "0").containsEntry("transId", "987654321");
        server.verify();
    }
    @Test void onlySignedBoundCreateRejectionIsExposedAsVerified() throws Exception {
        var result = createResult("");
        result.put("resultCode", 98);
        result.put("signature", sign("accessKey=test-access&amount=100000&orderId=reference&partnerCode=MOMO_TEST&payUrl="
                + "&requestId=reference&responseTime=1721725424433&resultCode=98"));
        server.expect(anything()).andRespond(withSuccess(new ObjectMapper().writeValueAsString(result), MediaType.APPLICATION_JSON));
        assertThatThrownBy(() -> gateway.create("reference", BigDecimal.valueOf(100000), 55L, "recipient@example.test", "https://m4n.test/payment-return"))
                .isInstanceOfSatisfying(MomoCreateRejectedException.class, ex -> assertThat(ex.resultCode()).isEqualTo("98"));
        server.verify();
        server.reset();
        result.put("signature", "0".repeat(64));
        server.expect(anything()).andRespond(withSuccess(new ObjectMapper().writeValueAsString(result), MediaType.APPLICATION_JSON));
        assertThatThrownBy(() -> gateway.create("reference", BigDecimal.valueOf(100000), 55L, "recipient@example.test", "https://m4n.test/payment-return"))
                .isExactlyInstanceOf(PaymentProviderException.class);
    }
    private Map<String, Object> createResult(String url) throws Exception {
        var result = new HashMap<String, Object>(Map.of("partnerCode", "MOMO_TEST", "requestId", "reference", "orderId", "reference",
                "amount", 100000L, "responseTime", 1721725424433L, "resultCode", 0, "payUrl", url));
        result.put("signature", sign("accessKey=test-access&amount=100000&orderId=reference&partnerCode=MOMO_TEST&payUrl="
                + url + "&requestId=reference&responseTime=1721725424433&resultCode=0"));
        return result;
    }
    private String sign(String canonical) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256"); mac.init(new SecretKeySpec(SECRET.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        return HexFormat.of().formatHex(mac.doFinal(canonical.getBytes(StandardCharsets.UTF_8)));
    }
}
