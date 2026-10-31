package com.m4n.backend.config;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.env.Environment;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Path;
import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;

/** Manual deployment gate: run with -Dtest=HostedDemoDeploymentSmoke against a prepared disposable schema. */
@ActiveProfiles("prod")
@DirtiesContext
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.DEFINED_PORT, properties = {
        "spring.config.additional-location=file:src/main/resources/application.properties",
        "PORT=0",
        "m4n.jwt.secret=synthetic-hosted-demo-test-signing-value-private-2026",
        "FRONTEND_URL=https://shop.example.test",
        "CORS_ALLOWED_ORIGINS=https://shop.example.test",
        "PRODUCT_IMAGE_PUBLIC_BASE_URL=https://demo.up.railway.app/api/v1/media",
        "OTP_EMAIL_ENABLED=true",
        "GMAIL_USERNAME=sender@example.test",
        "GMAIL_APP_PASSWORD=synthetic-mail-password",
        "SEED_DEV_ACCOUNTS=false",
        "INITIAL_ADMIN_ENABLED=false",
        "RESET_EMAIL_ENABLED=false",
        "GHN_ENABLED=false",
        "VNPAY_ENABLED=false",
        "MOMO_ENABLED=true",
        "MOMO_SANDBOX_DEPLOYMENT_ENABLED=true",
        "MOMO_PARTNER_CODE=MOMO_TEST",
        "MOMO_ACCESS_KEY=synthetic-access",
        "MOMO_SECRET_KEY=synthetic-only-test-private-secret",
        "MOMO_REDIRECT_URL=https://shop.example.test/payment-return",
        "MOMO_IPN_URL=https://demo.up.railway.app/api/v1/payments/momo/ipn"
})
class HostedDemoDeploymentSmoke {
    @Autowired private Environment environment;
    @Value("${local.server.port}") private int port;

    @DynamicPropertySource
    static void mediaDirectory(DynamicPropertyRegistry registry) {
        registry.add("PRODUCT_IMAGE_DIRECTORY", () -> Path.of("target", "hosted-demo-test-media").toAbsolutePath().toString());
    }

    @Test
    void securedProdProfileStartsOnPlatformPortAndOffersConfiguredSandbox() throws Exception {
        assertThat(environment.getProperty("server.port")).isEqualTo("0");
        assertThat(port).isPositive();
        assertThat(environment.getProperty("spring.jpa.hibernate.ddl-auto")).isEqualTo("validate");
        assertThat(environment.getProperty("m4n.auth.cookie.secure", Boolean.class)).isTrue();
        assertThat(environment.getProperty("m4n.seed.dev-accounts", Boolean.class)).isFalse();
        assertThat(environment.getProperty("springdoc.api-docs.enabled", Boolean.class)).isFalse();
        try (HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build()) {
            HttpResponse<String> health = client.send(request("/api/v1/health"), HttpResponse.BodyHandlers.ofString());
            assertThat(health.statusCode()).isEqualTo(200);
            assertThat(health.body()).contains("\"status\":\"UP\"");
            HttpResponse<String> options = client.send(request("/api/v1/payments/options"), HttpResponse.BodyHandlers.ofString());
            assertThat(options.statusCode()).isEqualTo(200);
            assertThat(options.body()).contains("\"momoAvailable\":true", "\"vnpayAvailable\":false");
        }
    }

    private HttpRequest request(String path) {
        return HttpRequest.newBuilder(URI.create("http://localhost:" + port + path))
                .timeout(Duration.ofSeconds(10)).GET().build();
    }
}
