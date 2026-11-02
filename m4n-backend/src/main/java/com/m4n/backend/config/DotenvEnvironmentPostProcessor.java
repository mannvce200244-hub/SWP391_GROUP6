package com.m4n.backend.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.EnvironmentPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;
import org.springframework.core.env.StandardEnvironment;

import java.io.BufferedReader;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;

/**
 * Automatically loads environment variables from a local .env file into the Spring Environment.
 * Real system environment variables take precedence so production deployments using Docker,
 * Kubernetes, or OS environment variables continue to work without modification.
 */
public class DotenvEnvironmentPostProcessor implements EnvironmentPostProcessor, Ordered {

    private static final Logger log = LoggerFactory.getLogger(DotenvEnvironmentPostProcessor.class);

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        Path envPath = findEnvFile();
        if (envPath == null) {
            return;
        }

        Map<String, Object> envProperties = new HashMap<>();
        try (BufferedReader reader = Files.newBufferedReader(envPath, StandardCharsets.UTF_8)) {
            String line;
            while ((line = reader.readLine()) != null) {
                line = line.trim();
                if (line.isEmpty() || line.startsWith("#")) {
                    continue;
                }
                int equalsIndex = line.indexOf('=');
                if (equalsIndex > 0) {
                    String key = line.substring(0, equalsIndex).trim();
                    String value = line.substring(equalsIndex + 1).trim();

                    // Strip surrounding quotes if present: "value" or 'value'
                    if ((value.startsWith("\"") && value.endsWith("\"")) ||
                        (value.startsWith("'") && value.endsWith("'"))) {
                        if (value.length() >= 2) {
                            value = value.substring(1, value.length() - 1);
                        }
                    }

                    if (!key.isEmpty()) {
                        envProperties.put(key, value);
                    }
                }
            }
        } catch (IOException e) {
            log.warn("Could not read .env file at {}: {}", envPath, e.getMessage());
            return;
        }

        if (!envProperties.isEmpty()) {
            MapPropertySource dotenvSource = new MapPropertySource("dotenvProperties", envProperties);
            if (environment.getPropertySources().contains(StandardEnvironment.SYSTEM_ENVIRONMENT_PROPERTY_SOURCE_NAME)) {
                // Add right after OS system environment so real system env vars have priority
                environment.getPropertySources().addAfter(
                    StandardEnvironment.SYSTEM_ENVIRONMENT_PROPERTY_SOURCE_NAME,
                    dotenvSource
                );
            } else {
                environment.getPropertySources().addLast(dotenvSource);
            }
            log.info("Loaded {} environment variables from {}", envProperties.size(), envPath.toAbsolutePath());
        }
    }

    private Path findEnvFile() {
        // 1. Current working directory: ./.env
        Path path = Paths.get(".env");
        if (Files.isRegularFile(path)) {
            return path;
        }
        // 2. Subdirectory (if run from parent dir): ./m4n-backend/.env
        path = Paths.get("m4n-backend", ".env");
        if (Files.isRegularFile(path)) {
            return path;
        }
        // 3. Parent directory: ../.env
        path = Paths.get("..", ".env");
        if (Files.isRegularFile(path)) {
            return path;
        }
        return null;
    }

    @Override
    public int getOrder() {
        // Run early so properties are available for other processors & property resolving
        return Ordered.HIGHEST_PRECEDENCE;
    }
}
