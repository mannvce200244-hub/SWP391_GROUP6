package com.m4n.backend.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import java.net.URI;
import java.net.InetAddress;
import java.net.UnknownHostException;
import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

@Component
public class VnpayProperties {
    private final boolean enabled;
    private final String merchantCode;
    private final String hashSecret;
    private final String returnUrl;
    private final String ipnUrl;
    private final String serverIp;
    private final Set<String> allowedReturnOrigins;

    @Autowired
    public VnpayProperties(@Value("${m4n.payment.vnpay.enabled:false}") boolean enabled,
            @Value("${m4n.payment.vnpay.merchant-code:}") String merchantCode,
            @Value("${m4n.payment.vnpay.hash-secret:}") String hashSecret,
            @Value("${m4n.payment.vnpay.return-url:}") String returnUrl,
            @Value("${m4n.payment.vnpay.ipn-url:}") String ipnUrl,
            @Value("${m4n.payment.vnpay.server-ip:}") String serverIp,
            @Value("${m4n.cors.allowed-origins:http://localhost:5173}") String allowedOrigins) {
        this.enabled = enabled;
        this.merchantCode = merchantCode;
        this.hashSecret = hashSecret;
        this.returnUrl = returnUrl;
        this.ipnUrl = ipnUrl;
        this.serverIp = serverIp;
        this.allowedReturnOrigins = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isEmpty())
                .collect(Collectors.toUnmodifiableSet());
        if (enabled && !isAvailable()) throw new IllegalStateException(
                "Enabled VNPay requires merchant code, secret, HTTPS return/IPN URLs and literal server IP configuration.");
    }

    public VnpayProperties(boolean enabled, String merchantCode, String hashSecret,
            String returnUrl, String ipnUrl, String serverIp) {
        this(enabled, merchantCode, hashSecret, returnUrl, ipnUrl, serverIp, "http://localhost:5173");
    }

    public boolean isAvailable() {
        return enabled && merchantCode.matches("[A-Za-z0-9]{8}") && !hashSecret.isBlank()
                && hashSecret.indexOf('\n') < 0 && hashSecret.indexOf('\r') < 0
                && safeUrl(returnUrl) && returnUrl.length() <= 226 && safeUrl(ipnUrl)
                && isLiteralIp(serverIp);
    }
    public String merchantCode() { return merchantCode; }
    public String hashSecret() { return hashSecret; }
    public String returnUrl() { return returnUrl; }
    public String serverIp() { return serverIp; }

    public String posReturnUrlFor(String origin) {
        if (origin == null) {
            URI configured = URI.create(returnUrl);
            return configured.getScheme() + "://" + configured.getRawAuthority() + "/pos";
        }
        try {
            URI uri = URI.create(origin);
            boolean secureOrLoopback = "https".equals(uri.getScheme())
                    || ("http".equals(uri.getScheme()) && ("localhost".equals(uri.getHost()) || "127.0.0.1".equals(uri.getHost())));
            if (allowedReturnOrigins.contains(origin) && secureOrLoopback && uri.getHost() != null
                    && uri.getUserInfo() == null && uri.getQuery() == null && uri.getFragment() == null
                    && origin.equals(uri.getScheme() + "://" + uri.getRawAuthority())) {
                return origin + "/pos";
            }
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Nguồn thanh toán không hợp lệ.");
        }
        throw new IllegalArgumentException("Nguồn thanh toán không được cho phép.");
    }

    public static boolean isLiteralIp(String value) {
        if (value == null || !value.matches("[0-9a-fA-F:.]{3,45}")) return false;
        if (!value.contains(":")) {
            String[] parts = value.split("\\.", -1);
            if (parts.length != 4) return false;
            for (String part : parts) {
                if (!part.matches("[0-9]{1,3}") || Integer.parseInt(part) > 255) return false;
            }
            return true;
        }
        try {
            // Colon plus the literal-only character allowlist prevents hostname resolution.
            InetAddress.getByName(value);
            return true;
        } catch (UnknownHostException ex) {
            return false;
        }
    }
    private boolean safeUrl(String value) {
        try {
            URI uri = URI.create(value);
            boolean secureOrLoopback = "https".equals(uri.getScheme())
                    || ("http".equals(uri.getScheme()) && ("localhost".equals(uri.getHost()) || "127.0.0.1".equals(uri.getHost())));
            return secureOrLoopback && uri.getHost() != null && uri.getUserInfo() == null
                && uri.getFragment() == null && uri.getQuery() == null && value.length() <= 255;
        } catch (IllegalArgumentException ex) { return false; }
    }
}
