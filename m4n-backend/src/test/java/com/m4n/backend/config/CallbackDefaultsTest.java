package com.m4n.backend.config;

import org.junit.jupiter.api.Test;
import org.springframework.core.env.PropertiesPropertySource;
import java.nio.file.Files;
import java.nio.file.Path;
import org.springframework.mock.env.MockEnvironment;
import java.util.Properties;
import static org.assertj.core.api.Assertions.assertThat;

class CallbackDefaultsTest {
    @Test
    void frontendOriginDefinesPaymentAndGoogleReturnsWhenNoOverrideIsSet() throws Exception {
        var properties = new Properties();
        try (var input = Files.newInputStream(Path.of("src/main/resources/application.properties"))) {
            properties.load(input);
        }
        var env = new MockEnvironment().withProperty("FRONTEND_URL", "https://shop.example.test");
        env.getPropertySources().addLast(new PropertiesPropertySource("application", properties));
        assertThat(env.getProperty("m4n.payment.vnpay.return-url")).isEqualTo("https://shop.example.test/payment-return");
        assertThat(env.getProperty("m4n.payment.momo.redirect-url")).isEqualTo("https://shop.example.test/payment-return");
        assertThat(env.getProperty("m4n.auth.google.redirect-uri"))
                .isEqualTo("https://shop.example.test/api/v1/auth/google/callback/google");
    }
}
