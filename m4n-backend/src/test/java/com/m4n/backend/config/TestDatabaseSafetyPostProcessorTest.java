package com.m4n.backend.config;

import org.junit.jupiter.api.Test;
import org.springframework.boot.EnvironmentPostProcessor;
import org.springframework.core.io.support.SpringFactoriesLoader;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class TestDatabaseSafetyPostProcessorTest {
    @Test
    void testRuntimeDiscoversSafetyGuard() {
        assertThat(SpringFactoriesLoader.loadFactoryNames(EnvironmentPostProcessor.class, getClass().getClassLoader()))
                .contains(TestDatabaseSafetyPostProcessor.class.getName());
    }

    @Test
    void allowsOnlyDedicatedLocalTestDatabases() {
        assertThatCode(() -> TestDatabaseSafetyPostProcessor.validate(
                "jdbc:postgresql://localhost:5432/m4n_ui7_test_20261103")).doesNotThrowAnyException();
        assertThatCode(() -> TestDatabaseSafetyPostProcessor.validate(
                "jdbc:postgresql://127.0.0.1/m4n_test")).doesNotThrowAnyException();
        for (String url : new String[]{"jdbc:postgresql://localhost:5432/m4n_db",
                "jdbc:postgresql://production.neon.tech/m4n_test", "", "not-a-url",
                "jdbc:postgresql://user:secret@localhost/m4n_test"}) {
            assertThatThrownBy(() -> TestDatabaseSafetyPostProcessor.validate(url))
                    .isInstanceOf(IllegalStateException.class).hasMessageContaining("dedicated test database");
        }
    }
}
