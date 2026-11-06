package com.m4n.backend.service;

import com.m4n.backend.entity.Role;
import com.m4n.backend.entity.RoleName;
import com.m4n.backend.entity.User;
import com.m4n.backend.repository.RoleRepository;
import com.m4n.backend.repository.UserRepository;
import com.m4n.backend.service.serviceImpl.GoogleLoginServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GoogleLoginServiceTest {
    @Mock UserRepository users;
    @Mock RoleRepository roles;
    @Mock PasswordEncoder passwords;
    @Mock RefreshTokenService refreshTokens;
    GoogleLoginService service;

    @BeforeEach void setup() { service = new GoogleLoginServiceImpl(users, roles, passwords, refreshTokens); }

    GoogleLoginService.Identity identity(String email, String hd) {
        return new GoogleLoginService.Identity("subject-1", email, "Google Customer", true, hd);
    }

    User customer(boolean verified) {
        return User.builder().id(12L).email("customer@gmail.com").password("original-bcrypt")
                .fullName("Keep my name").emailVerified(verified).isActive(true)
                .role(Role.builder().name(RoleName.CUSTOMER).build()).build();
    }

    void issue(User user) {
        when(refreshTokens.createRefreshToken(user, "browser", "127.0.0.1"))
                .thenReturn(new RefreshTokenService.TokenPair(user, "raw-refresh"));
    }

    @Test void newCustomerGetsVerifiedEmailUniqueSubjectAndRandomHashedPassword() {
        when(roles.findByName(RoleName.CUSTOMER)).thenReturn(Optional.of(Role.builder().name(RoleName.CUSTOMER).build()));
        when(passwords.encode(anyString())).thenReturn("random-bcrypt");
        when(users.saveAndFlush(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(refreshTokens.createRefreshToken(any(User.class), anyString(), anyString()))
                .thenAnswer(invocation -> new RefreshTokenService.TokenPair(invocation.getArgument(0), "raw-refresh"));
        assertThat(service.signIn(identity("NEW@gmail.com", null), "browser", "127.0.0.1")).isEqualTo("raw-refresh");
        verify(users).saveAndFlush(argThat(user -> user.getEmail().equals("new@gmail.com") && user.isEmailVerified()
                && user.getGoogleSubject().equals("subject-1") && user.getPassword().equals("random-bcrypt")
                && user.getRole().getName() == RoleName.CUSTOMER));
    }

    @Test void verifiedCustomerIsLinkedWithoutChangingPasswordOrProfile() {
        User user = customer(true);
        when(users.findByEmailIgnoreCaseWithLock("customer@gmail.com")).thenReturn(Optional.of(user));
        when(users.saveAndFlush(user)).thenReturn(user);
        issue(user);
        service.signIn(identity("Customer@gmail.com", null), "browser", "127.0.0.1");
        assertThat(user.getGoogleSubject()).isEqualTo("subject-1");
        assertThat(user.getPassword()).isEqualTo("original-bcrypt");
        assertThat(user.getFullName()).isEqualTo("Keep my name");
        verifyNoInteractions(passwords);
    }

    @Test void unverifiedSignupPasswordIsInvalidatedWhenGoogleClaimsTheAccount() {
        User user = customer(false);
        when(users.findByEmailIgnoreCaseWithLock("customer@gmail.com")).thenReturn(Optional.of(user));
        when(passwords.encode(anyString())).thenReturn("unusable-bcrypt");
        when(users.saveAndFlush(user)).thenReturn(user);
        issue(user);
        service.signIn(identity("customer@gmail.com", null), "browser", "127.0.0.1");
        assertThat(user.isEmailVerified()).isTrue();
        assertThat(user.getPassword()).isEqualTo("unusable-bcrypt");
        assertThat(user.getSessionVersion()).isEqualTo(1);
    }

    @Test void linkedSubjectResolvesAccountWithoutOverwritingChangedProviderEmail() {
        User user = customer(true);
        user.setGoogleSubject("subject-1");
        when(users.findByGoogleSubject("subject-1")).thenReturn(Optional.of(user));
        issue(user);
        service.signIn(identity("changed@gmail.com", null), "browser", "127.0.0.1");
        verify(users, never()).findByEmailIgnoreCaseWithLock(anyString());
        assertThat(user.getEmail()).isEqualTo("customer@gmail.com");
    }

    @Test void staffAndDisabledAccountsNeverReceiveSessions() {
        for (RoleName role : RoleName.values()) {
            if (role == RoleName.CUSTOMER) continue;
            User user = customer(true);
            user.setRole(Role.builder().name(role).build());
            when(users.findByEmailIgnoreCaseWithLock("customer@gmail.com")).thenReturn(Optional.of(user));
            assertThatThrownBy(() -> service.signIn(identity("customer@gmail.com", null), "browser", "127.0.0.1"))
                    .isInstanceOf(BadCredentialsException.class);
        }
        User disabled = customer(true);
        disabled.setActive(false);
        when(users.findByGoogleSubject("subject-1")).thenReturn(Optional.of(disabled));
        assertThatThrownBy(() -> service.signIn(identity("customer@gmail.com", null), "browser", "127.0.0.1"))
                .isInstanceOf(DisabledException.class);
        verifyNoInteractions(refreshTokens);
    }

    @Test void unverifiedEmailAndConflictingSubjectAreRejected() {
        assertThatThrownBy(() -> service.signIn(new GoogleLoginService.Identity("s", "customer@gmail.com", "Name", false, null), "b", "ip"))
                .isInstanceOf(BadCredentialsException.class);
        verifyNoInteractions(users);
        User user = customer(true);
        user.setGoogleSubject("another-subject");
        when(users.findByEmailIgnoreCaseWithLock("customer@gmail.com")).thenReturn(Optional.of(user));
        assertThatThrownBy(() -> service.signIn(identity("customer@gmail.com", null), "browser", "127.0.0.1"))
                .isInstanceOf(BadCredentialsException.class);
        verifyNoInteractions(refreshTokens);
    }

    @Test void existingThirdPartyEmailRequiresAuthoritativeWorkspaceDomainForAutoLink() {
        User user = customer(true);
        user.setEmail("customer@example.test");
        when(users.findByEmailIgnoreCaseWithLock(user.getEmail())).thenReturn(Optional.of(user));
        assertThatThrownBy(() -> service.signIn(identity(user.getEmail(), null), "browser", "127.0.0.1"))
                .isInstanceOf(BadCredentialsException.class);
        when(users.saveAndFlush(user)).thenReturn(user);
        issue(user);
        service.signIn(identity(user.getEmail(), "example.test"), "browser", "127.0.0.1");
        assertThat(user.getGoogleSubject()).isEqualTo("subject-1");
    }
}
