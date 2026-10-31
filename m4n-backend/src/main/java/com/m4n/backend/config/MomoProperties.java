package com.m4n.backend.config;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import java.net.URI;
import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

@Component
public class MomoProperties {
    private final boolean enabled;
    private final String partnerCode, accessKey, secretKey, redirectUrl, ipnUrl;
    private final Set<String> allowedReturnOrigins;
    public MomoProperties(@Value("${m4n.payment.momo.enabled:false}") boolean enabled,
            @Value("${m4n.payment.momo.partner-code:}") String partnerCode,
            @Value("${m4n.payment.momo.access-key:}") String accessKey,
            @Value("${m4n.payment.momo.secret-key:}") String secretKey,
            @Value("${m4n.payment.momo.redirect-url:}") String redirectUrl,
            @Value("${m4n.payment.momo.ipn-url:}") String ipnUrl,
            @Value("${m4n.cors.allowed-origins:http://localhost:5173}") String allowedOrigins) {
        this.enabled = enabled; this.partnerCode = partnerCode; this.accessKey = accessKey;
        this.secretKey = secretKey; this.redirectUrl = redirectUrl; this.ipnUrl = ipnUrl;
        this.allowedReturnOrigins = Arrays.stream(allowedOrigins.split(",")).map(String::trim)
                .filter(origin -> !origin.isEmpty()).collect(Collectors.toUnmodifiableSet());
    }
    public boolean available() { return enabled && partnerCode.matches("[A-Za-z0-9_-]{1,50}")
            && accessKey.matches("[A-Za-z0-9_-]{1,100}") && secretKey.matches("[A-Za-z0-9_-]{16,255}")
            && safeUrl(redirectUrl) && safeUrl(ipnUrl); }
    private boolean safeUrl(String value) {
        try { URI uri = URI.create(value); return "https".equals(uri.getScheme()) && uri.getHost() != null
                && uri.getUserInfo() == null && uri.getQuery() == null && uri.getFragment() == null && value.length() <= 255; }
        catch (IllegalArgumentException ex) { return false; }
    }
    public String partnerCode() { return partnerCode; }
    public String accessKey() { return accessKey; }
    public String secretKey() { return secretKey; }
    public String redirectUrl() { return redirectUrl; }
    public String redirectUrlFor(String origin) {
        if (origin == null) return redirectUrl;
        try {
            URI uri = URI.create(origin);
            boolean secureOrLoopback = "https".equals(uri.getScheme()) || "http".equals(uri.getScheme())
                    && ("localhost".equals(uri.getHost()) || "127.0.0.1".equals(uri.getHost()));
            if (allowedReturnOrigins.contains(origin) && secureOrLoopback && uri.getHost() != null
                    && uri.getUserInfo() == null && uri.getQuery() == null && uri.getFragment() == null
                    && origin.equals(uri.getScheme() + "://" + uri.getRawAuthority())) {
                return origin + URI.create(redirectUrl).getRawPath();
            }
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Nguồn thanh toán không hợp lệ.");
        }
        throw new IllegalArgumentException("Nguồn thanh toán không được cho phép.");
    }
    public String ipnUrl() { return ipnUrl; }
}
