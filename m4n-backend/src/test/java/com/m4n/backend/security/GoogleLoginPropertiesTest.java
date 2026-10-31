package com.m4n.backend.security;

import com.m4n.backend.config.GoogleLoginProperties;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.*;

class GoogleLoginPropertiesTest {
    @Test void acceptsLocalLegacyAndSameOriginHttpsCallbacksWithoutExposingSecrets() {
        assertThat(new GoogleLoginProperties(true, "client", "secret",
                "http://localhost:8080/login/oauth2/code/google", "http://localhost:5173").toString())
                .doesNotContain("secret");
        var config = new GoogleLoginProperties(true, "client", "secret",
                "https://shop.example/api/v1/auth/google/callback/google", "https://shop.example");
        assertThat(config.loginUrl("success")).isEqualTo("https://shop.example/login?google=success");
    }

    @Test void rejectsCrossOriginOrUntrustedCallbacks() {
        for (String callback : new String[]{"https://evil.example/api/v1/auth/google/callback/google",
                "https://shop.example/login/oauth2/code/google", "https://shop.example/api/v1/auth/google/callback/google?next=evil",
                "http://shop.example/api/v1/auth/google/callback/google"}) {
            assertThatIllegalArgumentException().isThrownBy(() ->
                    new GoogleLoginProperties(true, "client", "secret", callback, "https://shop.example"));
        }
    }
}
