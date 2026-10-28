package com.m4n.backend.config;

import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ProductionConfigurationTest {
    @Test
    void completeHttpsCodDeploymentPassesConfigurationChecks() {
        assertThatCode(() -> ProductionConfiguration.validate(safeEnvironment())).doesNotThrowAnyException();
    }

    @Test
    void unsafeDatabaseAndSessionOverridesAreRejected() {
        reject("spring.jpa.hibernate.ddl-auto", "update");
        reject("m4n.auth.cookie.secure", "false");
        reject("m4n.seed.dev-accounts", "true");
        reject("spring.datasource.password", "");
        reject("m4n.jwt.secret", "m4n-only-test-signing-key-never-use-for-deployment-2026");
        reject("m4n.jwt.access-expiration-minutes", "0");
        reject("m4n.jwt.refresh-expiration-days", "0");
    }

    @Test
    void missingHttpsOriginsAndLocalMediaConfigurationAreRejected() {
        reject("m4n.frontend.url", "http://localhost:5173");
        reject("m4n.frontend.url", "https://localhost");
        reject("m4n.frontend.url", "https://shop.example.test/");
        reject("m4n.cors.allowed-origins", "*");
        reject("m4n.cors.allowed-origins", "https://shop.example.test,");
        reject("m4n.cors.allowed-origins", "https://another.example.test");
        reject("m4n.media.public-base-url", "http://localhost:8080/api/v1/media");
        reject("m4n.media.directory", "./data/product-images");
    }

    @Test
    void sandboxPaymentsRequireExplicitDemoOptInAndSwaggerStaysDisabled() {
        reject("m4n.payment.vnpay.enabled", "true");
        assertThatThrownBy(() -> ProductionConfiguration.validate(
                safeEnvironment().withProperty("m4n.payment.momo.enabled", "true")))
                .hasMessageContaining("m4n.payment.momo.sandbox-deployment-enabled");
        reject("springdoc.api-docs.enabled", "true");
        reject("springdoc.swagger-ui.enabled", "true");
    }

    @Test
    void hostedMomoSandboxPassesOnlyWithCompleteCredentialsAndPermanentCallbacks() {
        assertThatCode(() -> ProductionConfiguration.validate(hostedDemo())).doesNotThrowAnyException();
        for (String key : new String[]{"partner-code", "access-key", "secret-key", "redirect-url", "ipn-url"}) {
            assertThatThrownBy(() -> ProductionConfiguration.validate(
                    hostedDemo().withProperty("m4n.payment.momo." + key, "")))
                    .isInstanceOf(IllegalStateException.class).hasMessageContaining("m4n.payment.momo");
        }
    }

    @Test
    void hostedDemoRejectsWrongReturnSiteStaleTunnelsAndIncorrectIpnPaths() {
        assertThatThrownBy(() -> ProductionConfiguration.validate(hostedDemo()
                .withProperty("m4n.payment.momo.redirect-url", "https://another.example.test/payment-return")))
                .hasMessageContaining("m4n.payment.momo.redirect-url");
        for (String ipn : new String[]{"http://localhost:8080/api/v1/payments/momo/ipn",
                "https://temporary.trycloudflare.com/api/v1/payments/momo/ipn",
                "https://api.example.test/payment-return", "https://127.0.0.1/api/v1/payments/momo/ipn",
                "https://10.0.0.1/api/v1/payments/momo/ipn", "https://api.railway.internal/api/v1/payments/momo/ipn"}) {
            assertThatThrownBy(() -> ProductionConfiguration.validate(hostedDemo()
                    .withProperty("m4n.payment.momo.ipn-url", ipn)))
                    .isInstanceOf(IllegalStateException.class).hasMessageContaining("m4n.payment.momo");
        }
        assertThatThrownBy(() -> ProductionConfiguration.validate(hostedDemo()
                .withProperty("m4n.frontend.url", "https://temporary.trycloudflare.com")
                .withProperty("m4n.cors.allowed-origins", "https://temporary.trycloudflare.com")
                .withProperty("m4n.payment.momo.redirect-url", "https://temporary.trycloudflare.com/payment-return")))
                .hasMessageContaining("m4n.payment.momo.redirect-url");
    }

    private MockEnvironment hostedDemo() {
        return safeEnvironment()
                .withProperty("m4n.payment.momo.enabled", "true")
                .withProperty("m4n.payment.momo.sandbox-deployment-enabled", "true")
                .withProperty("m4n.payment.momo.partner-code", "MOMO_TEST")
                .withProperty("m4n.payment.momo.access-key", "test-access")
                .withProperty("m4n.payment.momo.secret-key", "synthetic-private-test-secret")
                .withProperty("m4n.payment.momo.redirect-url", "https://shop.example.test/payment-return")
                .withProperty("m4n.payment.momo.ipn-url", "https://m4n-demo.up.railway.app/api/v1/payments/momo/ipn");
    }

    @Test
    void maintainedOtpFlowsRequireSenderConfiguration() {
        reject("m4n.auth.otp-email.enabled", "false");
        reject("spring.mail.username", "");
        reject("spring.mail.password", "");
    }

    @Test
    void enabledGhnMustUseProductionAndCompleteCredentials() {
        MockEnvironment environment = safeEnvironment().withProperty("m4n.shipping.ghn.enabled", "true");
        assertThatThrownBy(() -> ProductionConfiguration.validate(environment)).hasMessageContaining("m4n.shipping.ghn.production");
        environment.withProperty("m4n.shipping.ghn.production", "true");
        assertThatThrownBy(() -> ProductionConfiguration.validate(environment)).hasMessageContaining("m4n.shipping.ghn.token");
        environment.withProperty("m4n.shipping.ghn.token", "synthetic-test-token");
        assertThatThrownBy(() -> ProductionConfiguration.validate(environment)).hasMessageContaining("m4n.shipping.ghn.shop-id");
        environment.withProperty("m4n.shipping.ghn.shop-id", "1");
        assertThatCode(() -> ProductionConfiguration.validate(environment)).doesNotThrowAnyException();
    }

    @Test
    void rejectedValuesNeverAppearInDiagnosticMessages() {
        MockEnvironment environment = safeEnvironment().withProperty("m4n.media.public-base-url",
                "https://user:private-test-password@media.example.test/api/v1/media");
        assertThatThrownBy(() -> ProductionConfiguration.validate(environment))
                .hasMessageContaining("m4n.media.public-base-url").hasMessageNotContaining("private-test-password");
    }

    private void reject(String key, String value) {
        assertThatThrownBy(() -> ProductionConfiguration.validate(safeEnvironment().withProperty(key, value)))
                .isInstanceOf(IllegalStateException.class).hasMessageContaining(key.split(" ")[0]);
    }

    private MockEnvironment safeEnvironment() {
        return new MockEnvironment()
                .withProperty("spring.jpa.hibernate.ddl-auto", "validate")
                .withProperty("m4n.auth.cookie.secure", "true")
                .withProperty("spring.datasource.url", "jdbc:postgresql://localhost:5432/dedicated_test")
                .withProperty("spring.datasource.username", "test-runtime")
                .withProperty("spring.datasource.password", "synthetic-test-only")
                .withProperty("m4n.jwt.secret", "synthetic-production-check-key-test-only-2026")
                .withProperty("m4n.jwt.access-expiration-minutes", "15")
                .withProperty("m4n.jwt.refresh-expiration-days", "7")
                .withProperty("m4n.frontend.url", "https://shop.example.test")
                .withProperty("m4n.cors.allowed-origins", "https://shop.example.test")
                .withProperty("m4n.media.public-base-url", "https://shop.example.test/api/v1/media")
                .withProperty("m4n.media.directory", Path.of("data/product-images").toAbsolutePath().toString())
                .withProperty("m4n.auth.otp-email.enabled", "true")
                .withProperty("spring.mail.username", "sender@example.test")
                .withProperty("spring.mail.password", "synthetic-mail-password");
    }
}
