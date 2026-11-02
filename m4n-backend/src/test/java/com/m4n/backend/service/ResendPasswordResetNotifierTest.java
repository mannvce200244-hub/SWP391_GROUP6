package com.m4n.backend.service;

import com.m4n.backend.exception.PasswordResetDeliveryException;
import com.m4n.backend.service.serviceImpl.ResendPasswordResetNotifier;
import org.junit.jupiter.api.*;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

class ResendPasswordResetNotifierTest {
    MockRestServiceServer server; RestClient.Builder wrapper;
    @BeforeEach void setup() { RestClient.Builder actual = RestClient.builder().baseUrl("https://api.resend.com");
        server = MockRestServiceServer.bindTo(actual).build(); wrapper = mock(RestClient.Builder.class, RETURNS_SELF);
        when(wrapper.build()).thenAnswer(inv -> actual.build()); }
    @Test void sendsRealProviderContractWithRequiredHeadersAndResetLink() {
        var notifier = configured();
        server.expect(requestTo("https://api.resend.com/emails"))
                .andExpect(header("Authorization", "Bearer unit-test-key"))
                .andExpect(header("User-Agent", "m4n-backend/1.0"))
                .andExpect(jsonPath("$.to[0]").value("customer@m4n.test"))
                .andExpect(jsonPath("$.text").value(org.hamcrest.Matchers.containsString("https://m4n.test/reset-password?token=raw-test-token")))
                .andRespond(withSuccess("{\"id\":\"accepted-provider-id\"}", MediaType.APPLICATION_JSON));
        notifier.sendPasswordResetNotification("customer@m4n.test", "raw-test-token"); server.verify();
    }
    @Test void providerFailureDoesNotExposeBodyOrClaimDelivery() {
        server.expect(requestTo("https://api.resend.com/emails"))
                .andRespond(withStatus(org.springframework.http.HttpStatus.UNAUTHORIZED).body("sensitive-provider-body"));
        assertThatThrownBy(() -> configured().sendPasswordResetNotification("customer@m4n.test", "raw-test-token"))
                .isInstanceOf(PasswordResetDeliveryException.class).hasMessageNotContaining("sensitive");
    }
    @Test void disabledDeliveryIsUnavailableAndInvalidEnabledConfigFailsClosed() {
        assertThat(new ResendPasswordResetNotifier(wrapper, false, "", "", "http://localhost:5173", 15).isAvailable()).isFalse();
        assertThatThrownBy(() -> new ResendPasswordResetNotifier(wrapper, true, "", "", "https://m4n.test", 15)).isInstanceOf(IllegalStateException.class);
        assertThatThrownBy(() -> new ResendPasswordResetNotifier(wrapper, true, "key", "reset@m4n.test", "http://untrusted.test", 15)).isInstanceOf(IllegalStateException.class);
    }
    private ResendPasswordResetNotifier configured() { return new ResendPasswordResetNotifier(wrapper, true, "unit-test-key", "reset@m4n.test", "https://m4n.test", 15); }
}
