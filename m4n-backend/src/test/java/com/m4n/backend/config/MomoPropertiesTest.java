package com.m4n.backend.config;

import org.junit.jupiter.api.Test;
import java.util.List;
import static org.assertj.core.api.Assertions.*;

class MomoPropertiesTest {
    private final MomoProperties properties = new MomoProperties(true, "MOMO_TEST", "test-access",
            "test-only-private-secret", "https://m4n.test/payment-return", "https://api.m4n.test/api/v1/payments/momo/ipn",
            "http://localhost:5173,http://127.0.0.1:5173,https://m4n.test,https://other.m4n.test,http://insecure.test");

    @Test void returnKeepsTheExactAllowedCheckoutOriginAndConfiguredPath() {
        for (String origin : List.of("http://localhost:5173", "http://127.0.0.1:5173", "https://m4n.test", "https://other.m4n.test")) {
            assertThat(properties.redirectUrlFor(origin)).isEqualTo(origin + "/payment-return");
        }
        assertThat(properties.redirectUrlFor(null)).isEqualTo(properties.redirectUrl());
    }

    @Test void untrustedMalformedAndNonLoopbackHttpOriginsCannotBecomeRedirects() {
        for (String origin : List.of("", "null", "http:500", "http://localhost:9999", "https://evil.test",
                "https://m4n.test.evil.test", "https://m4n.test@evil.test", "https://evil.test@m4n.test",
                "https://m4n.test/", "https://m4n.test/path", "https://m4n.test?next=evil", "https://m4n.test#evil",
                "http://insecure.test", "javascript:alert(1)", "https://m4n.test\r\nLocation: evil")) {
            assertThatThrownBy(() -> properties.redirectUrlFor(origin)).isInstanceOf(IllegalArgumentException.class);
        }
    }
}
