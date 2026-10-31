package com.m4n.backend.security;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.util.concurrent.atomic.AtomicBoolean;

import static org.assertj.core.api.Assertions.assertThat;

class AuthCookieRequestFilterTest {
    private final AuthCookieRequestFilter filter = new AuthCookieRequestFilter(
            "https://shop.example.test,http://localhost:5173", new JwtAccessDeniedHandler());

    @Test
    void simpleRefreshAndLogoutRequestsAreRejectedBeforeCookieMutation() throws Exception {
        for (String endpoint : new String[]{"refresh", "logout"}) {
            MockHttpServletRequest request = request("/api/v1/auth/" + endpoint);
            MockHttpServletResponse response = new MockHttpServletResponse();
            AtomicBoolean invoked = new AtomicBoolean();
            filter.doFilter(request, response, (req, res) -> invoked.set(true));
            assertThat(response.getStatus()).isEqualTo(403);
            assertThat(invoked).isFalse();
            assertThat(response.getContentAsString()).contains("Access is denied.");
            assertThat(response.getHeader("Set-Cookie")).isNull();
        }
    }

    @Test
    void sameSiteSiblingAndOpaqueOriginsCannotRevokeCookies() throws Exception {
        for (String origin : new String[]{"https://evil.example.test", "null", "https://shop.example.test.attacker.test"}) {
            MockHttpServletRequest request = request("/api/v1/auth/logout");
            request.addHeader("X-Requested-With", "M4N");
            request.addHeader("Origin", origin);
            MockHttpServletResponse response = new MockHttpServletResponse();
            filter.doFilter(request, response, (req, res) -> { throw new AssertionError("Untrusted request reached endpoint"); });
            assertThat(response.getStatus()).isEqualTo(403);
        }
    }

    @Test
    void trustedBrowserAndExplicitNonBrowserRequestsReachAuthService() throws Exception {
        for (String origin : new String[]{"https://shop.example.test", "http://localhost:5173", null}) {
            MockHttpServletRequest request = request("/api/v1/auth/refresh");
            request.addHeader("X-Requested-With", "M4N");
            if (origin != null) request.addHeader("Origin", origin);
            AtomicBoolean invoked = new AtomicBoolean();
            filter.doFilter(request, new MockHttpServletResponse(), (req, res) -> invoked.set(true));
            assertThat(invoked).isTrue();
        }
    }

    @Test
    void deploymentContextPathCannotBypassProtection() throws Exception {
        MockHttpServletRequest request = request("/m4n/api/v1/auth/logout");
        request.setContextPath("/m4n");
        MockHttpServletResponse response = new MockHttpServletResponse();
        filter.doFilter(request, response, (req, res) -> { throw new AssertionError("Request bypassed protection"); });
        assertThat(response.getStatus()).isEqualTo(403);
    }

    @Test
    void providerNotificationsAndBearerApisDoNotRequireBrowserHeader() throws Exception {
        for (String path : new String[]{"/api/v1/payments/momo/ipn", "/api/v1/orders", "/api/v1/auth/login"}) {
            AtomicBoolean invoked = new AtomicBoolean();
            filter.doFilter(request(path), new MockHttpServletResponse(), (req, res) -> invoked.set(true));
            assertThat(invoked).isTrue();
        }
    }

    private MockHttpServletRequest request(String path) {
        return new MockHttpServletRequest("POST", path);
    }
}
