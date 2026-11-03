package com.m4n.backend.security;

import com.m4n.backend.config.GoogleLoginProperties;
import com.m4n.backend.service.GoogleLoginService;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.oidc.OidcIdToken;
import org.springframework.security.oauth2.core.oidc.user.DefaultOidcUser;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class GoogleLoginHandlerTest {
    GoogleLoginService service = mock(GoogleLoginService.class);
    GoogleLoginProperties properties = new GoogleLoginProperties(true, "client", "secret", "http://localhost:5173/api/v1/auth/google/callback/google", "http://localhost:5173");
    GoogleLoginHandler handler = new GoogleLoginHandler(service, properties, new AuthCookieService(7, true));

    OAuth2AuthenticationToken authentication() {
        var token = new OidcIdToken("provider-token", Instant.now(), Instant.now().plusSeconds(60),
                Map.of("sub", "subject", "email", "customer@gmail.com", "email_verified", true, "name", "Customer"));
        var user = new DefaultOidcUser(List.of(new SimpleGrantedAuthority("ROLE_USER")), token);
        return new OAuth2AuthenticationToken(user, user.getAuthorities(), "google");
    }

    @Test void successUsesRefreshCookieAndFixedRedirectWithoutProviderTokens() throws Exception {
        when(service.signIn(any(), any(), any())).thenReturn("m4n-raw-refresh");
        var request = new MockHttpServletRequest();
        var session = request.getSession();
        var response = new MockHttpServletResponse();
        handler.onAuthenticationSuccess(request, response, authentication());
        assertThat(response.getRedirectedUrl()).isEqualTo("http://localhost:5173/login?google=success");
        assertThat(response.getHeaders("Set-Cookie")).anyMatch(cookie -> cookie.contains("m4n_refresh_token=m4n-raw-refresh") && cookie.contains("HttpOnly") && cookie.contains("Secure"));
        assertThat(response.getContentAsString()).doesNotContain("provider-token");
        assertThat(((org.springframework.mock.web.MockHttpSession) session).isInvalid()).isTrue();
        assertThat(response.getHeader("Cache-Control")).isEqualTo("no-store");
    }

    @Test void rejectedCustomerAndCancelledConsentNeverSetRefreshCookie() throws Exception {
        when(service.signIn(any(), any(), any())).thenThrow(new BadCredentialsException("private detail"));
        var response = new MockHttpServletResponse();
        handler.onAuthenticationSuccess(new MockHttpServletRequest(), response, authentication());
        assertThat(response.getRedirectedUrl()).endsWith("google=not_allowed");
        assertThat(response.getHeaders("Set-Cookie")).noneMatch(cookie -> cookie.contains("m4n_refresh_token="));
        response = new MockHttpServletResponse();
        handler.onAuthenticationFailure(new MockHttpServletRequest(), response, new OAuth2AuthenticationException(new OAuth2Error("access_denied")));
        assertThat(response.getRedirectedUrl()).endsWith("google=cancelled");
    }

    @Test void configurationRejectsMissingSecretsAndCrossOriginOrMalformedCallbacks() {
        assertThatThrownBy(() -> new GoogleLoginProperties(true, "client", "", properties.redirectUri(), properties.frontendUrl())).isInstanceOf(IllegalArgumentException.class);
        for (String callback : List.of("https://evil.test/api/v1/auth/google/callback/google", "http://localhost:5173/other", properties.redirectUri() + "?next=https://evil.test")) {
            assertThatThrownBy(() -> new GoogleLoginProperties(true, "client", "secret", callback, properties.frontendUrl())).isInstanceOf(IllegalArgumentException.class);
        }
        assertThat(properties.toString()).doesNotContain("secret");
    }
}
