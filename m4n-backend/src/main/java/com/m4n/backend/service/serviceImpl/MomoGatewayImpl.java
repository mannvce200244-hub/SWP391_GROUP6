package com.m4n.backend.service.serviceImpl;

import tools.jackson.databind.JsonNode;
import com.m4n.backend.config.MomoProperties;
import com.m4n.backend.exception.PaymentProviderException;
import com.m4n.backend.exception.MomoCreateRejectedException;
import com.m4n.backend.service.MomoGateway;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.*;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URI;
import java.net.http.HttpClient;
import java.nio.charset.StandardCharsets;
import java.math.BigDecimal;
import java.security.MessageDigest;
import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class MomoGatewayImpl implements MomoGateway {
    private final MomoProperties properties;
    private final RestClient client;
    private static final List<String> IPN_FIELDS = List.of("amount", "extraData", "message", "orderId", "orderInfo",
            "orderType", "partnerCode", "payType", "requestId", "responseTime", "resultCode", "transId");

    @org.springframework.beans.factory.annotation.Autowired
    public MomoGatewayImpl(MomoProperties properties) {
        this(properties, createClient());
    }
    MomoGatewayImpl(MomoProperties properties, RestClient client) {
        this.properties = properties;
        this.client = client;
    }
    private static RestClient createClient() {
        var factory = new JdkClientHttpRequestFactory(HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5))
                .followRedirects(HttpClient.Redirect.NEVER).build());
        factory.setReadTimeout(Duration.ofSeconds(35));
        return RestClient.builder().baseUrl("https://test-payment.momo.vn").requestFactory(factory).build();
    }

    @Override public String create(String reference, BigDecimal amount, Long orderId, String customerEmail, String redirectUrl) {
        return createPayment(reference, amount, "Thanh toan don hang " + orderId, customerEmail,
                redirectUrl + "?m4nOrderId=" + orderId);
    }

    @Override public String createPos(String reference, BigDecimal amount, String customerEmail, String redirectUrl) {
        return createPayment(reference, amount, "Thanh toan POS " + reference, customerEmail,
                redirectUrl + "?m4nPosPaymentId=" + reference);
    }

    private String createPayment(String reference, BigDecimal amount, String orderInfo, String customerEmail, String redirectUrl) {
        Map<String, String> values = base(reference, reference);
        values.put("amount", amount.toBigIntegerExact().toString()); values.put("extraData", "");
        values.put("orderInfo", orderInfo); values.put("ipnUrl", properties.ipnUrl());
        values.put("redirectUrl", redirectUrl); values.put("requestType", "payWithCC");
        Map<String, Object> body = new LinkedHashMap<>(values);
        body.put("amount", amount.longValueExact()); body.put("autoCapture", true);
        body.put("userInfo", Map.of("email", customerEmail));
        body.put("signature", signature(values, List.of("amount", "extraData", "ipnUrl", "orderId", "orderInfo",
                "partnerCode", "redirectUrl", "requestId", "requestType")));
        Map<String, String> result = post("create", body);
        requireIdentity(result, reference, reference, amount);
        // Sandbox may omit the create signature. HTTPS-bound creation only yields a pending URL, never payment success.
        boolean signed = matches(result, List.of("amount", "orderId", "partnerCode", "payUrl", "requestId", "responseTime", "resultCode"));
        if (!signed && (result.containsKey("signature") || !"0".equals(result.get("resultCode")))) {
            throw new PaymentProviderException();
        }
        if (!"0".equals(result.get("resultCode"))) throw new MomoCreateRejectedException(result.get("resultCode"));
        String url = result.get("payUrl");
        if (!safePaymentUrl(url)) throw new PaymentProviderException();
        return url;
    }

    @Override public Map<String, String> query(String reference, BigDecimal amount) {
        String request = UUID.randomUUID().toString();
        Map<String, String> values = base(reference, request);
        values.put("signature", signature(values, List.of("orderId", "partnerCode", "requestId")));
        Map<String, String> result = post("query", new LinkedHashMap<>(values));
        requireIdentity(result, reference, request, amount);
        return result;
    }

    @Override public Map<String, String> refund(String reference, String originalTransaction, BigDecimal amount, String reason) {
        Map<String, String> values = base(reference, reference);
        values.put("amount", amount.toBigIntegerExact().toString()); values.put("transId", originalTransaction);
        values.put("description", reason);
        Map<String, Object> body = new LinkedHashMap<>(values);
        body.put("amount", amount.longValueExact()); body.put("transId", Long.parseLong(originalTransaction));
        body.put("signature", signature(values, List.of("amount", "description", "orderId", "partnerCode", "requestId", "transId")));
        Map<String, String> result = post("refund", body);
        requireIdentity(result, reference, reference, amount);
        return result;
    }

    @Override public boolean verifyIpn(Map<String, String> result) {
        return properties.available() && properties.partnerCode().equals(result.get("partnerCode"))
                && matches(result, IPN_FIELDS);
    }

    private Map<String, String> base(String reference, String request) {
        return new LinkedHashMap<>(Map.of("partnerCode", properties.partnerCode(), "orderId", reference, "requestId", request, "lang", "vi"));
    }
    private Map<String, String> post(String operation, Map<String, Object> body) {
        try {
            JsonNode node = client.post().uri("/v2/gateway/api/" + operation).contentType(MediaType.APPLICATION_JSON)
                    .body(body).retrieve().body(JsonNode.class);
            if (node == null || !node.isObject()) throw new PaymentProviderException();
            Map<String, String> result = new HashMap<>();
            node.properties().forEach(entry -> {
                if (entry.getValue().isValueNode() && !entry.getValue().isNull()) result.put(entry.getKey(), entry.getValue().asText());
            });
            return result;
        } catch (RestClientException ex) { throw new PaymentProviderException(); }
    }
    private void requireIdentity(Map<String, String> result, String reference, String request, BigDecimal amount) {
        if (!properties.partnerCode().equals(result.get("partnerCode")) || !reference.equals(result.get("orderId"))
                || !request.equals(result.get("requestId")) || !amount.toBigIntegerExact().toString().equals(result.get("amount"))
                || !Objects.toString(result.get("resultCode"), "").matches("[0-9]{1,6}")) throw new PaymentProviderException();
    }
    private boolean matches(Map<String, String> result, List<String> fields) {
        String supplied = result.get("signature");
        if (supplied == null || !supplied.matches("[0-9a-fA-F]{64}") || fields.stream().anyMatch(f -> !result.containsKey(f))) return false;
        return MessageDigest.isEqual(HexFormat.of().parseHex(supplied), HexFormat.of().parseHex(signature(result, fields)));
    }
    private String signature(Map<String, String> values, List<String> fields) {
        String content = "accessKey=" + properties.accessKey() + "&" + fields.stream()
                .map(f -> f + "=" + values.get(f)).collect(Collectors.joining("&"));
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(properties.secretKey().getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(content.getBytes(StandardCharsets.UTF_8)));
        } catch (java.security.GeneralSecurityException ex) { throw new IllegalStateException("HMAC unavailable"); }
    }
    private boolean safePaymentUrl(String value) {
        try {
            URI uri = URI.create(value);
            return value.length() <= 2000 && "https".equals(uri.getScheme()) && "test-payment.momo.vn".equals(uri.getHost())
                    && uri.getPort() == -1 && uri.getUserInfo() == null && uri.getFragment() == null
                    && "/v2/gateway/pay".equals(uri.getPath());
        } catch (IllegalArgumentException | NullPointerException ex) { return false; }
    }
}
