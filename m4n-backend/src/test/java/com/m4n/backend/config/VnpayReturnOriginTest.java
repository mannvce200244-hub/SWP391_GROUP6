package com.m4n.backend.config;

import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class VnpayReturnOriginTest {
    private VnpayProperties properties(String returnUrl, String origins) {
        return new VnpayProperties(true, "TEST1234", "synthetic-signing-secret", returnUrl,
                "https://api.example.test/api/v1/payments/vnpay/ipn", "127.0.0.1", origins);
    }

    @Test
    void hostedBrowserOverridesAnOldLocalReturnAndPosUsesItsOwnPath() {
        var p = properties("http://localhost:5173/payment-return", "https://shop.example.test");
        assertThat(p.checkoutReturnUrlFor("https://shop.example.test"))
                .isEqualTo("https://shop.example.test/payment-return");
        assertThat(p.posReturnUrlFor("https://shop.example.test")).isEqualTo("https://shop.example.test/pos");
        assertThatThrownBy(() -> p.checkoutReturnUrlFor(null)).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void absentOriginUsesOnlyAnAllowlistedConfiguredReturnSite() {
        var p = properties("https://shop.example.test/payment-return", "https://shop.example.test");
        assertThat(p.checkoutReturnUrlFor(null)).isEqualTo("https://shop.example.test/payment-return");
    }

    @Test
    void explicitLocalDevelopmentRemainsSupported() {
        var p = properties("http://localhost:5173/payment-return", "http://localhost:5173");
        assertThat(p.checkoutReturnUrlFor("http://localhost:5173")).isEqualTo("http://localhost:5173/payment-return");
    }

    @Test
    void arbitrarySitesPathsCredentialsAndAmbiguousOriginsAreRejected() {
        var p = properties("https://shop.example.test/payment-return", "https://shop.example.test");
        for (String origin : new String[]{"https://evil.test", "https://shop.example.test.evil.test",
                "https://shop.example.test/", "https://shop.example.test?next=evil", "https://shop.example.test#x",
                "https://user@shop.example.test", "null", "http://localhost:5173"}) {
            assertThatThrownBy(() -> p.checkoutReturnUrlFor(origin)).isInstanceOf(IllegalArgumentException.class);
        }
    }
}
