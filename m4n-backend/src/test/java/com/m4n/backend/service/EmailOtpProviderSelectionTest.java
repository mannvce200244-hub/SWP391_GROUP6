package com.m4n.backend.service;

import com.m4n.backend.service.serviceImpl.GmailEmailOtpNotifier;
import com.m4n.backend.service.serviceImpl.BrevoEmailOtpNotifier;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.web.client.RestClient;

import static org.assertj.core.api.Assertions.assertThat;

class EmailOtpProviderSelectionTest {
    private final ApplicationContextRunner context = new ApplicationContextRunner()
            .withBean(RestClient.Builder.class, RestClient::builder)
            .withUserConfiguration(GmailEmailOtpNotifier.class, BrevoEmailOtpNotifier.class);

    @Test
    void defaultLocalProviderIsGmailOnly() {
        context.run(ctx -> {
            assertThat(ctx).hasSingleBean(EmailOtpNotifier.class);
            assertThat(ctx.getBean(EmailOtpNotifier.class)).isInstanceOf(GmailEmailOtpNotifier.class);
        });
    }

    @Test
    void brevoSelectionDoesNotNeedSmtpSenderOrCredentials() {
        context.withPropertyValues("m4n.auth.otp-email.provider=brevo", "m4n.auth.otp-email.enabled=true",
                "m4n.auth.otp-email.api-key=unit-test-key", "m4n.auth.otp-email.from=verify@example.test")
                .run(ctx -> {
                    assertThat(ctx).hasSingleBean(EmailOtpNotifier.class);
                    assertThat(ctx.getBean(EmailOtpNotifier.class)).isInstanceOf(BrevoEmailOtpNotifier.class);
                    assertThat(ctx.getBean(EmailOtpNotifier.class).isAvailable()).isTrue();
                });
    }
}
