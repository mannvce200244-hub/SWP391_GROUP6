package com.m4n.backend.config;

import org.springframework.beans.factory.config.BeanFactoryPostProcessor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.env.Environment;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.Locale;
import java.util.Set;

/** Validates deployment settings before JPA or startup runners can change persistent data. */
@Configuration(proxyBeanMethods = false)
@Profile("prod")
public class ProductionConfiguration {
    @Bean
    static BeanFactoryPostProcessor productionConfigurationCheck(Environment environment) {
        return beanFactory -> validate(environment);
    }

    static void validate(Environment environment) {
        require("validate".equals(value(environment, "spring.jpa.hibernate.ddl-auto")), "spring.jpa.hibernate.ddl-auto");
        require(flag(environment, "m4n.auth.cookie.secure"), "m4n.auth.cookie.secure");
        require(!flag(environment, "m4n.seed.dev-accounts"), "m4n.seed.dev-accounts");
        require(!flag(environment, "springdoc.api-docs.enabled") && !flag(environment, "springdoc.swagger-ui.enabled"),
                "springdoc.api-docs.enabled / springdoc.swagger-ui.enabled");
        require(value(environment, "spring.datasource.url").startsWith("jdbc:postgresql:"), "spring.datasource.url");
        require(!value(environment, "spring.datasource.username").isBlank(), "spring.datasource.username");
        require(!value(environment, "spring.datasource.password").isBlank(), "spring.datasource.password");
        String secret = value(environment, "m4n.jwt.secret");
        require(secret.getBytes(StandardCharsets.UTF_8).length >= 32 && !secret.contains("m4n-only-test-signing-key"), "m4n.jwt.secret");
        require(environment.getProperty("m4n.jwt.access-expiration-minutes", Long.class, 0L) > 0,
                "m4n.jwt.access-expiration-minutes");
        require(environment.getProperty("m4n.jwt.refresh-expiration-days", Long.class, 0L) > 0,
                "m4n.jwt.refresh-expiration-days");
        String frontend = value(environment, "m4n.frontend.url");
        require(httpsUrl(frontend, true), "m4n.frontend.url");
        String origins = value(environment, "m4n.cors.allowed-origins");
        String[] allowed = origins.split(",", -1);
        require(Arrays.stream(allowed).allMatch(origin -> httpsUrl(origin.trim(), true))
                && Arrays.stream(allowed).map(String::trim).anyMatch(frontend::equals), "m4n.cors.allowed-origins");
        require(httpsUrl(value(environment, "m4n.media.public-base-url"), false), "m4n.media.public-base-url");
        require(absolutePath(value(environment, "m4n.media.directory")), "m4n.media.directory");
        // Registration and the maintained password-reset UI both require email OTP delivery.
        require(flag(environment, "m4n.auth.otp-email.enabled"), "m4n.auth.otp-email.enabled");
        require(value(environment, "spring.mail.username").matches("[^\\s@]+@[^\\s@]+\\.[^\\s@]+"), "spring.mail.username");
        require(!value(environment, "spring.mail.password").isBlank(), "spring.mail.password");
        require(!flag(environment, "m4n.payment.vnpay.enabled"), "m4n.payment.vnpay.enabled (sandbox only)");
        if (flag(environment, "m4n.payment.momo.enabled")) {
            require(flag(environment, "m4n.payment.momo.sandbox-deployment-enabled"),
                    "m4n.payment.momo.sandbox-deployment-enabled (demo only)");
            MomoProperties momo = new MomoProperties(true,
                    value(environment, "m4n.payment.momo.partner-code"),
                    value(environment, "m4n.payment.momo.access-key"),
                    value(environment, "m4n.payment.momo.secret-key"),
                    value(environment, "m4n.payment.momo.redirect-url"),
                    value(environment, "m4n.payment.momo.ipn-url"), origins);
            require(momo.available(), "m4n.payment.momo credentials / callbacks");
            require(momo.redirectUrl().equals(frontend + "/payment-return")
                    && deploymentCallback(momo.redirectUrl(), "/payment-return"), "m4n.payment.momo.redirect-url");
            require(deploymentCallback(momo.ipnUrl(), "/api/v1/payments/momo/ipn"), "m4n.payment.momo.ipn-url");
        }
        if (flag(environment, "m4n.shipping.ghn.enabled")) {
            require(flag(environment, "m4n.shipping.ghn.production"), "m4n.shipping.ghn.production");
            require(!value(environment, "m4n.shipping.ghn.token").isBlank()
                    && !value(environment, "m4n.shipping.ghn.token").contains("\n")
                    && !value(environment, "m4n.shipping.ghn.token").contains("\r"), "m4n.shipping.ghn.token");
            require(environment.getProperty("m4n.shipping.ghn.shop-id", Integer.class, 0) > 0, "m4n.shipping.ghn.shop-id");
        }
    }

    private static boolean deploymentCallback(String value, String path) {
        if (!httpsUrl(value, false)) return false;
        URI uri = URI.create(value);
        String host = uri.getHost().toLowerCase(Locale.ROOT);
        return path.equals(uri.getRawPath()) && host.contains(".")
                && !host.matches("[0-9.]+") && !host.contains(":")
                && !host.endsWith(".trycloudflare.com") && !host.endsWith(".local")
                && !host.endsWith(".internal");
    }

    private static boolean httpsUrl(String value, boolean originOnly) {
        try {
            URI uri = URI.create(value);
            String host = uri.getHost();
            return "https".equals(uri.getScheme()) && host != null && !host.isBlank()
                    && !Set.of("localhost", "127.0.0.1", "[::1]", "::1").contains(host.toLowerCase(Locale.ROOT))
                    && !host.toLowerCase(Locale.ROOT).endsWith(".localhost")
                    && uri.getUserInfo() == null && uri.getQuery() == null && uri.getFragment() == null
                    && (!originOnly || uri.getRawPath().isEmpty());
        } catch (IllegalArgumentException ex) {
            return false;
        }
    }

    private static boolean absolutePath(String value) {
        try { return !value.isBlank() && Path.of(value).isAbsolute(); }
        catch (IllegalArgumentException ex) { return false; }
    }

    private static String value(Environment environment, String key) {
        return environment.getProperty(key, "");
    }

    private static boolean flag(Environment environment, String key) {
        return environment.getProperty(key, Boolean.class, false);
    }

    private static void require(boolean valid, String key) {
        if (!valid) throw new IllegalStateException("Production configuration requires a safe value for " + key + ".");
    }
}
