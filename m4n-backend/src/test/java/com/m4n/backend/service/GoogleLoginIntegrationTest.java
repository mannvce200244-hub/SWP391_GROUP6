package com.m4n.backend.service;

import com.m4n.backend.entity.RoleName;
import com.m4n.backend.entity.User;
import com.m4n.backend.repository.RoleRepository;
import com.m4n.backend.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.*;

@SpringBootTest
class GoogleLoginIntegrationTest {
    @Autowired GoogleLoginService google;
    @Autowired AuthService auth;
    @Autowired UserRepository users;
    @Autowired RoleRepository roles;
    @Autowired PasswordEncoder passwords;
    @Autowired JdbcTemplate jdbc;
    String email;
    String subject;

    @BeforeEach void setup() {
        String id = UUID.randomUUID().toString();
        email = "google-test-" + id + "@gmail.com";
        subject = "subject-" + id;
    }

    @AfterEach void cleanup() {
        users.findByEmailIgnoreCase(email).ifPresent(user -> {
            jdbc.update("DELETE FROM refresh_tokens WHERE user_id = ?", user.getId());
            users.deleteById(user.getId());
        });
    }

    GoogleLoginService.Identity identity() {
        return new GoogleLoginService.Identity(subject, email, "Google Test Customer", true, null);
    }

    User existing(boolean verified) {
        return users.saveAndFlush(User.builder().email(email).password(passwords.encode("KnownPassword123!"))
                .fullName("Keep Existing Profile").emailVerified(verified).isActive(true)
                .role(roles.findByName(RoleName.CUSTOMER).orElseThrow()).build());
    }

    @Test void newGoogleCustomerUsesExistingRefreshAndJwtLifecycle() {
        String refresh = google.signIn(identity(), "test", "127.0.0.1");
        var session = auth.refresh(refresh, "test", "127.0.0.1");
        assertThat(session.authResponse().user().email()).isEqualTo(email);
        assertThat(session.authResponse().user().role()).isEqualTo(RoleName.CUSTOMER);
        assertThat(session.authResponse().accessToken()).isNotBlank();
        User customer = users.findByEmailIgnoreCase(email).orElseThrow();
        assertThat(customer.isEmailVerified()).isTrue();
        assertThat(customer.getGoogleSubject()).isEqualTo(subject);
        assertThat(passwords.matches("KnownPassword123!", customer.getPassword())).isFalse();
    }

    @Test void existingCustomerKeepsIdentityWhileUnverifiedPasswordCannotBecomeActive() {
        User initial = existing(false);
        google.signIn(identity(), "test", "127.0.0.1");
        User claimed = users.findByEmailIgnoreCase(email).orElseThrow();
        assertThat(claimed.getId()).isEqualTo(initial.getId());
        assertThat(claimed.getFullName()).isEqualTo(initial.getFullName());
        assertThat(claimed.isEmailVerified()).isTrue();
        assertThat(claimed.getSessionVersion()).isEqualTo(initial.getSessionVersion() + 1);
        assertThat(passwords.matches("KnownPassword123!", claimed.getPassword())).isFalse();
        String encoded = claimed.getPassword();
        google.signIn(identity(), "test", "127.0.0.1");
        assertThat(users.findByEmailIgnoreCase(email).orElseThrow().getPassword()).isEqualTo(encoded);
    }

    @Test void concurrentFirstLoginsCannotDuplicateAccountOrSubjectAndCanRetry() throws Exception {
        var ready = new CountDownLatch(2);
        var go = new CountDownLatch(1);
        try (var executor = Executors.newFixedThreadPool(2)) {
            java.util.concurrent.Callable<Boolean> attempt = () -> {
                ready.countDown();
                if (!go.await(10, TimeUnit.SECONDS)) throw new AssertionError("Concurrent login start timed out");
                try {
                    google.signIn(identity(), "test", "127.0.0.1");
                    return true;
                } catch (DataIntegrityViolationException expectedConflict) {
                    return false;
                }
            };
            var first = executor.submit(attempt);
            var second = executor.submit(attempt);
            assertThat(ready.await(10, TimeUnit.SECONDS)).isTrue();
            go.countDown();
            boolean one = first.get(30, TimeUnit.SECONDS);
            boolean two = second.get(30, TimeUnit.SECONDS);
            assertThat(one || two).isTrue();
        }
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM users WHERE lower(email) = ?", Integer.class, email)).isEqualTo(1);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM users WHERE google_subject = ?", Integer.class, subject)).isEqualTo(1);
        assertThat(google.signIn(identity(), "retry", "127.0.0.1")).isNotBlank();
    }
}
