package com.m4n.backend.service;

import com.m4n.backend.service.serviceImpl.BrevoEmailOtpNotifier;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;

import static org.assertj.core.api.Assertions.*;
import static org.hamcrest.Matchers.containsString;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

class BrevoEmailOtpNotifierTest {
    private MockRestServiceServer server;
    private RestClient.Builder builder;

    @BeforeEach
    void setup() {
        var actual = RestClient.builder().baseUrl("https://api.brevo.com");
        server = MockRestServiceServer.bindTo(actual).build();
        builder = mock(RestClient.Builder.class, RETURNS_SELF);
        when(builder.build()).thenAnswer(invocation -> actual.build());
    }

    @ParameterizedTest
    @CsvSource({"REGISTER,đăng ký tài khoản", "RESET_PASSWORD,đặt lại mật khẩu"})
    void sendsBothOtpPurposesAsBrandedTextAndHtml(String purpose, String action) {
        server.expect(requestTo("https://api.brevo.com/v3/smtp/email"))
                .andExpect(header("api-key", "unit-test-api-key"))
                .andExpect(header("User-Agent", "m4n-backend/1.0"))
                .andExpect(jsonPath("$.sender.email").value("verify@example.test"))
                .andExpect(jsonPath("$.sender.name").value("M4N"))
                .andExpect(jsonPath("$.to[0].email").value("customer@example.test"))
                .andExpect(jsonPath("$.subject").value("M4N — Mã xác thực " + action))
                .andExpect(jsonPath("$.textContent").value(containsString("Mã OTP của bạn: 123456")))
                .andExpect(jsonPath("$.htmlContent").value(containsString("email mới nhất")))
                .andRespond(withStatus(HttpStatus.CREATED).body("{\"messageId\":\"provider-id\"}").contentType(MediaType.APPLICATION_JSON));
        configured().sendCode("customer@example.test", "123456", purpose);
        server.verify();
    }

    @ParameterizedTest
    @ValueSource(ints = {400, 401, 403, 429, 500})
    void providerRejectionDoesNotExposePrivateDataOrClaimDelivery(int status) {
        server.expect(requestTo("https://api.brevo.com/v3/smtp/email"))
                .andRespond(withStatus(HttpStatus.valueOf(status)).body("private-provider-body-123456"));
        assertSafeFailure();
        server.verify();
    }

    @ParameterizedTest
    @ValueSource(strings = {"{}", "{\"messageId\":\"\"}", "{\"messageId\":123}", "invalid-json"})
    void malformedAcceptanceIsNotDeliverySuccess(String body) {
        server.expect(requestTo("https://api.brevo.com/v3/smtp/email"))
                .andRespond(withSuccess(body, MediaType.APPLICATION_JSON));
        assertSafeFailure();
        server.verify();
    }

    @Test
    void transportFailureIsSafeAndNotRetried() {
        server.expect(requestTo("https://api.brevo.com/v3/smtp/email"))
                .andRespond(withException(new IOException("private transport details")));
        assertSafeFailure();
        server.verify();
    }

    @Test
    void disabledDoesNotSendAndEnabledRejectsSmtpKeyOrInvalidSender() {
        var disabled = new BrevoEmailOtpNotifier(builder, false, "", "");
        assertThat(disabled.isAvailable()).isFalse();
        assertThatThrownBy(() -> disabled.sendCode("customer@example.test", "123456", "REGISTER"))
                .isInstanceOf(ResponseStatusException.class);
        for (String key : new String[]{"", "xsmtpsib-unit-test-smtp-key", "private\r\ninjected"}) {
            assertThatThrownBy(() -> new BrevoEmailOtpNotifier(builder, true, key, "verify@example.test"))
                    .isInstanceOf(IllegalStateException.class).hasMessageNotContaining("injected");
        }
        for (String from : new String[]{"", "invalid", "M4N <verify@example.test>"}) {
            assertThatThrownBy(() -> new BrevoEmailOtpNotifier(builder, true, "unit-test-api-key", from))
                    .isInstanceOf(IllegalStateException.class);
        }
    }

    private void assertSafeFailure() {
        assertThatThrownBy(() -> configured().sendCode("customer@example.test", "123456", "REGISTER"))
                .isInstanceOf(ResponseStatusException.class).hasMessageContaining("503")
                .hasMessageNotContaining("private").hasMessageNotContaining("123456")
                .hasMessageNotContaining("unit-test-api-key");
    }

    private BrevoEmailOtpNotifier configured() {
        return new BrevoEmailOtpNotifier(builder, true, "unit-test-api-key", "verify@example.test");
    }
}
