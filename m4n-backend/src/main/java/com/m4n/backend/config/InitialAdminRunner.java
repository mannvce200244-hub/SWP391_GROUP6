package com.m4n.backend.config;

import com.m4n.backend.service.InitialAdminService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
@Order(1)
public class InitialAdminRunner implements ApplicationRunner {
    private final InitialAdminService service;
    private final boolean enabled;
    private final String email;
    private final String fullName;
    private final String password;

    public InitialAdminRunner(InitialAdminService service,
            @Value("${m4n.bootstrap.admin.enabled:false}") boolean enabled,
            @Value("${m4n.bootstrap.admin.email:}") String email,
            @Value("${m4n.bootstrap.admin.full-name:}") String fullName,
            @Value("${m4n.bootstrap.admin.password:}") String password) {
        this.service = service;
        this.enabled = enabled;
        this.email = email;
        this.fullName = fullName;
        this.password = password;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (enabled) service.initialize(email, fullName, password);
    }
}
