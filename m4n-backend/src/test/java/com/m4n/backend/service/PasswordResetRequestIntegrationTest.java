package com.m4n.backend.service;

import com.m4n.backend.entity.*;
import com.m4n.backend.exception.PasswordResetDeliveryException;
import com.m4n.backend.repository.*;
import com.m4n.backend.util.TokenHashUtil;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.jdbc.core.JdbcTemplate;
import java.time.Instant;
import java.util.UUID;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@SpringBootTest
class PasswordResetRequestIntegrationTest {
    @Autowired PasswordResetRequestService service;
    @Autowired UserRepository users;
    @Autowired RoleRepository roles;
    @Autowired PasswordResetTokenRepository tokens;
    @Autowired JdbcTemplate jdbc;
    @MockitoBean PasswordResetNotifier notifier;
    User user;
    @BeforeEach void create() {
        user = users.saveAndFlush(User.builder().email("reset-delivery-" + UUID.randomUUID() + "@m4n.test")
                .fullName("Delivery fixture").password("encoded-test-only")
                .role(roles.findByName(RoleName.CUSTOMER).orElseThrow()).isActive(true).build());
    }
    @AfterEach void cleanup() {
        jdbc.update("DELETE FROM password_reset_tokens WHERE user_id = ?", user.getId());
        users.deleteById(user.getId());
    }
    @Test void failedDeliveryRollsBackNewTokenAndPreservesPreviouslyValidToken() {
        PasswordResetToken old = tokens.saveAndFlush(PasswordResetToken.builder().user(user)
                .tokenHash(TokenHashUtil.hashToken("old-reset-token-" + UUID.randomUUID()))
                .expiresAt(Instant.now().plusSeconds(600)).build());
        doThrow(new PasswordResetDeliveryException()).when(notifier).sendPasswordResetNotification(anyString(), anyString());
        assertThatThrownBy(() -> service.requestReset(user.getEmail())).isInstanceOf(PasswordResetDeliveryException.class);
        assertThat(tokens.findAllByUserIdAndUsedAtIsNull(user.getId())).extracting(PasswordResetToken::getId).containsExactly(old.getId());
    }
    @Test void acceptedDeliveryPersistsOnlyHashedSingleUseToken() {
        service.requestReset(user.getEmail());
        var active = tokens.findAllByUserIdAndUsedAtIsNull(user.getId());
        assertThat(active).hasSize(1);
        var capture = org.mockito.ArgumentCaptor.forClass(String.class);
        verify(notifier).sendPasswordResetNotification(eq(user.getEmail()), capture.capture());
        assertThat(active.getFirst().getTokenHash()).isEqualTo(TokenHashUtil.hashToken(capture.getValue())).isNotEqualTo(capture.getValue());
    }
}
