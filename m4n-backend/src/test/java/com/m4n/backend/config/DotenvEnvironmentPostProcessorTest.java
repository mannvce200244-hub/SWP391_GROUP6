package com.m4n.backend.config;

import org.junit.jupiter.api.Test;
import org.springframework.boot.EnvironmentPostProcessor;
import org.springframework.core.io.support.SpringFactoriesLoader;

import static org.assertj.core.api.Assertions.assertThat;

class DotenvEnvironmentPostProcessorTest {

    @Test
    void springBootDiscoversDotenvProcessorThroughItsCurrentFactoryContract() {
        assertThat(SpringFactoriesLoader.loadFactoryNames(
                EnvironmentPostProcessor.class, getClass().getClassLoader()))
                .contains(DotenvEnvironmentPostProcessor.class.getName());
    }
}
