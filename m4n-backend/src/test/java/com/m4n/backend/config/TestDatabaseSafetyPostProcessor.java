package com.m4n.backend.config;

import org.springframework.boot.EnvironmentPostProcessor;
import org.springframework.boot.SpringApplication;
import org.springframework.core.Ordered;
import org.springframework.core.env.ConfigurableEnvironment;

import java.net.URI;
import java.util.Locale;
import java.util.Set;

/** Integration fixtures must never reach application or hosted databases. */
public class TestDatabaseSafetyPostProcessor implements EnvironmentPostProcessor, Ordered {
    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        validate(environment.getProperty("spring.datasource.url", ""));
    }

    static void validate(String jdbcUrl) {
        try {
            if (!jdbcUrl.startsWith("jdbc:postgresql://")) throw new IllegalArgumentException();
            URI uri = URI.create(jdbcUrl.substring(5));
            String path = uri.getPath();
            String database = path == null || path.length() < 2 ? "" : path.substring(1).toLowerCase(Locale.ROOT);
            if (uri.getUserInfo() == null
                    && Set.of("localhost", "127.0.0.1", "[::1]", "::1").contains(uri.getHost())
                    && database.matches("[a-z0-9_]*test[a-z0-9_]*")) return;
        } catch (IllegalArgumentException | NullPointerException ignored) {
            // Report only the safe requirement, never credentials from a supplied URL.
        }
        throw new IllegalStateException("Tests require a local PostgreSQL database with 'test' in its name. Set DB_URL to a dedicated test database; application and hosted databases are blocked.");
    }

    @Override
    public int getOrder() { return Ordered.LOWEST_PRECEDENCE; }
}
