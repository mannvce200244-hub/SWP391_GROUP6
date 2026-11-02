package com.m4n.backend.config;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class GhnProperties {
    private final boolean enabled;
    private final boolean production;
    private final String token;
    private final int shopId;
    public GhnProperties(@Value("${m4n.shipping.ghn.enabled:false}") boolean enabled,
            @Value("${m4n.shipping.ghn.production:false}") boolean production,
            @Value("${m4n.shipping.ghn.token:}") String token,
            @Value("${m4n.shipping.ghn.shop-id:0}") int shopId) {
        this.enabled = enabled; this.production = production; this.token = token; this.shopId = shopId;
    }
    public boolean enabled() { return enabled; }
    public boolean available() { return enabled && !token.isBlank() && shopId > 0 && !token.contains("\n") && !token.contains("\r"); }
    public String token() { return token; }
    public int shopId() { return shopId; }
    public String baseUrl() { return production ? "https://online-gateway.ghn.vn/shiip/public-api"
            : "https://dev-online-gateway.ghn.vn/shiip/public-api"; }
}
