package com.m4n.backend.service.serviceImpl;

import com.m4n.backend.config.VnpayProperties;
import com.m4n.backend.exception.PaymentProviderException;
import com.m4n.backend.service.VnpayGateway;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.util.*;

@Service
public class VnpayGatewayImpl implements VnpayGateway {
    private final VnpayProperties properties;
    private final RestClient client;

    public VnpayGatewayImpl(VnpayProperties properties, RestClient.Builder builder) {
        this.properties = properties;
        var factory = new JdkClientHttpRequestFactory(HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5)).followRedirects(HttpClient.Redirect.NEVER).build());
        factory.setReadTimeout(Duration.ofSeconds(15));
        this.client = builder.baseUrl("https://sandbox.vnpayment.vn").requestFactory(factory).build();
    }

    @Override
    public String paymentUrl(Map<String, String> parameters) {
        String query = encodedQuery(parameters);
        return "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?" + query + "&vnp_SecureHash=" + sign(query);
    }

    @Override
    public boolean verifyIpn(Map<String, String> parameters) {
        return signatureMatches(encodedQuery(parameters), parameters.get("vnp_SecureHash"));
    }

    @Override
    public Map<String, String> query(Map<String, String> parameters) {
        return post(parameters, List.of("vnp_RequestId", "vnp_Version", "vnp_Command", "vnp_TmnCode", "vnp_TxnRef",
                "vnp_TransactionDate", "vnp_CreateDate", "vnp_IpAddr", "vnp_OrderInfo"), true);
    }

    @Override
    public Map<String, String> refund(Map<String, String> parameters) {
        return post(parameters, List.of("vnp_RequestId", "vnp_Version", "vnp_Command", "vnp_TmnCode", "vnp_TransactionType",
                "vnp_TxnRef", "vnp_Amount", "vnp_TransactionNo", "vnp_TransactionDate", "vnp_CreateBy",
                "vnp_CreateDate", "vnp_IpAddr", "vnp_OrderInfo"), false);
    }

    private Map<String, String> post(Map<String, String> parameters, List<String> requestFields, boolean query) {
        Map<String, String> request = new LinkedHashMap<>(parameters);
        request.put("vnp_SecureHash", sign(join(parameters, requestFields)));
        try {
            Map<?, ?> raw = client.post().uri("/merchant_webapi/api/transaction")
                    .contentType(MediaType.APPLICATION_JSON).body(request).retrieve().body(Map.class);
            if (raw == null) throw new PaymentProviderException();
            Map<String, String> response = new HashMap<>();
            raw.forEach((key, value) -> {
                if (key instanceof String name && (value instanceof String || value instanceof Number)) {
                    response.put(name, value.toString());
                }
            });
            List<String> fields = new ArrayList<>(List.of("vnp_ResponseId", "vnp_Command", "vnp_ResponseCode", "vnp_Message",
                    "vnp_TmnCode", "vnp_TxnRef", "vnp_Amount", "vnp_BankCode", "vnp_PayDate", "vnp_TransactionNo",
                    "vnp_TransactionType", "vnp_TransactionStatus", "vnp_OrderInfo"));
            if (query) fields.addAll(List.of("vnp_PromotionCode", "vnp_PromotionAmount"));
            if (!signatureMatches(join(response, fields), response.get("vnp_SecureHash"))) throw new PaymentProviderException();
            return response;
        } catch (RestClientException ex) {
            throw new PaymentProviderException();
        }
    }

    private String encodedQuery(Map<String, String> parameters) {
        return new TreeMap<>(parameters).entrySet().stream()
                .filter(entry -> entry.getKey().startsWith("vnp_") && !entry.getKey().equals("vnp_SecureHash")
                        && !entry.getKey().equals("vnp_SecureHashType") && entry.getValue() != null && !entry.getValue().isEmpty())
                .map(entry -> URLEncoder.encode(entry.getKey(), StandardCharsets.UTF_8) + "="
                        + URLEncoder.encode(entry.getValue(), StandardCharsets.UTF_8))
                .collect(java.util.stream.Collectors.joining("&"));
    }
    private String join(Map<String, String> values, List<String> fields) {
        return fields.stream().map(field -> values.getOrDefault(field, "")).collect(java.util.stream.Collectors.joining("|"));
    }
    private String sign(String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA512");
            mac.init(new SecretKeySpec(properties.hashSecret().getBytes(StandardCharsets.UTF_8), "HmacSHA512"));
            return HexFormat.of().formatHex(mac.doFinal(data.getBytes(StandardCharsets.UTF_8)));
        } catch (java.security.GeneralSecurityException ex) {
            throw new IllegalStateException("HmacSHA512 is unavailable.", ex);
        }
    }
    private boolean signatureMatches(String data, String supplied) {
        if (supplied == null || !supplied.matches("[0-9a-fA-F]{128}")) return false;
        return MessageDigest.isEqual(HexFormat.of().parseHex(sign(data)), HexFormat.of().parseHex(supplied));
    }
}
