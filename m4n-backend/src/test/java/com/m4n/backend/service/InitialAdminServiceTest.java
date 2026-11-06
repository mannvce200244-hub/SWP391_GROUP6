package com.m4n.backend.service;

import com.m4n.backend.entity.*;
import com.m4n.backend.repository.*;
import com.m4n.backend.service.serviceImpl.InitialAdminServiceImpl;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import java.util.Optional;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InitialAdminServiceTest {
    @Mock UserRepository users;
    @Mock RoleRepository roles;
    @Mock PasswordEncoder encoder;
    InitialAdminService service;
    @BeforeEach void setup() {
        service = new InitialAdminServiceImpl(users, roles, encoder);
        when(roles.findByNameWithLock(RoleName.SUPER_ADMIN)).thenReturn(Optional.of(Role.builder().name(RoleName.SUPER_ADMIN).build()));
    }
    @Test void createsOnlyInitialSuperAdminWithEncodedExternalPassword() {
        when(encoder.encode("PrivatePassword123!")).thenReturn("encoded");
        service.initialize("  Owner@M4N.test ", "Owner", "PrivatePassword123!");
        ArgumentCaptor<User> saved = ArgumentCaptor.forClass(User.class);
        verify(users).saveAndFlush(saved.capture());
        assertThat(saved.getValue().getEmail()).isEqualTo("owner@m4n.test");
        assertThat(saved.getValue().getPassword()).isEqualTo("encoded");
        assertThat(saved.getValue().getRole().getName()).isEqualTo(RoleName.SUPER_ADMIN);
    }
    @Test void existingSuperAdminIsNeverOverwrittenEvenWithMissingBootstrapSecrets() {
        when(users.existsByRoleName(RoleName.SUPER_ADMIN)).thenReturn(true);
        service.initialize(null, null, null);
        verify(users, never()).saveAndFlush(any());
        verifyNoInteractions(encoder);
    }
    @Test void duplicateCustomerEmailCannotBeElevated() {
        when(users.existsByEmailIgnoreCase("owner@m4n.test")).thenReturn(true);
        assertThatThrownBy(() -> service.initialize("owner@m4n.test", "Owner", "PrivatePassword123!"))
                .isInstanceOf(IllegalStateException.class).hasMessageContaining("cannot elevate");
        verify(users, never()).saveAndFlush(any());
    }
    @Test void missingOrOversizedSecretsFailClosed() {
        assertThatThrownBy(() -> service.initialize("owner@m4n.test", "Owner", ""))
                .isInstanceOf(IllegalStateException.class);
        assertThatThrownBy(() -> service.initialize("owner@m4n.test", "Owner", "ấ".repeat(25)))
                .isInstanceOf(IllegalStateException.class);
        verify(users, never()).saveAndFlush(any());
    }
}
