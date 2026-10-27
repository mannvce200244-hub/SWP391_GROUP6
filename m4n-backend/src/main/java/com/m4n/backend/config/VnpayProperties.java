package com.m4n.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import java.net.URI;
import java.net.InetAddress;
import java.net.UnknownHostException;

@Component
public class VnpayProperties {
    private final boolean enabled;
    private final String merchantCode;
    private final String hashSecret;
    private final String returnUrl;
    private final String ipnUrl;
    private final String serverIp;

    public VnpayProperties(@Value("${m4n.payment.vnpay.enabled:false}") boolean enabled,
            @Value("${m4n.payment.vnpay.merchant-code:}") String merchantCode,
            @Value("${m4n.payment.vnpay.hash-secret:}") String hashSecret,
            @Value("${m4n.payment.vnpay.return-url:}") String returnUrl,
            @Value("${m4n.payment.vnpay.ipn-url:}") String ipnUrl,
            @Value("${m4n.payment.vnpay.server-ip:}") String serverIp) {
        this.enabled = enabled;
        this.merchantCode = merchantCode;
        this.hashSecret = hashSecret;
        this.returnUrl = returnUrl;
        this.ipnUrl = ipnUrl;
        this.serverIp = serverIp;
        if (enabled && !isAvailable()) throw new IllegalStateException(
                "Enabled VNPay requires merchant code, secret, HTTPS return/IPN URLs and literal server IP configuration.");
    }

    public boolean isAvailable() {
        return enabled && merchantCode.matches("[A-Za-z0-9]{8}") && !hashSecret.isBlank()
                && hashSecret.indexOf('\n') < 0 && hashSecret.indexOf('\r') < 0
                && safeHttpsUrl(returnUrl) && returnUrl.length() <= 226 && safeHttpsUrl(ipnUrl)
                && isLiteralIp(serverIp);
    }
    public String merchantCode() { return merchantCode; }
    public String hashSecret() { return hashSecret; }
    public String returnUrl() { return returnUrl; }
    public String serverIp() { return serverIp; }

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
    private boolean safeHttpsUrl(String value) {
        try {
            URI uri = URI.create(value);
            return "https".equals(uri.getScheme()) && uri.getHost() != null && uri.getUserInfo() == null
                    && uri.getFragment() == null && uri.getQuery() == null && value.length() <= 255;
        } catch (IllegalArgumentException ex) { return false; }
    }
}
