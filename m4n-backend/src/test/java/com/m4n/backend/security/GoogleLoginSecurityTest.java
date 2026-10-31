package com.m4n.backend.security;

import com.m4n.backend.config.GoogleLoginProperties;
import com.m4n.backend.controller.GoogleLoginController;
import com.m4n.backend.service.GoogleLoginService;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.RSASSASigner;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.gen.RSAKeyGenerator;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.registration.InMemoryClientRegistrationRepository;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.core.context.SecurityContextImpl;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.junit.jupiter.web.SpringJUnitWebConfig;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;
import org.springframework.web.util.UriComponentsBuilder;
import tools.jackson.databind.ObjectMapper;

import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringJUnitWebConfig(GoogleLoginSecurityTest.Config.class)
@TestPropertySource(properties = {"m4n.auth.google.enabled=true", "m4n.auth.google.client-id=test-client",
        "m4n.auth.google.client-secret=test-secret", "m4n.auth.google.redirect-uri=http://localhost:5173/api/v1/auth/google/callback/google"})
class GoogleLoginSecurityTest {
    @Autowired WebApplicationContext context;
    @Autowired GoogleLoginService service;
    @Autowired Provider provider;
    @Autowired GoogleLoginProperties properties;
    @org.springframework.test.context.bean.override.mockito.MockitoSpyBean GoogleLoginHandler handler;
    MockMvc mvc;

    @BeforeEach void setup() {
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        reset(service);
        when(service.signIn(any(), any(), any())).thenReturn("raw-test-refresh");
    }

    MvcResult start() throws Exception {
        return mvc.perform(get("/api/v1/auth/google/authorization/google")).andExpect(status().is3xxRedirection()).andReturn();
    }

    Map<String, String> parameters(MvcResult start) {
        var parameters = UriComponentsBuilder.fromUriString(start.getResponse().getRedirectedUrl()).build().getQueryParams().toSingleValueMap();
        parameters.replaceAll((name, value) -> org.springframework.web.util.UriUtils.decode(value, StandardCharsets.UTF_8));
        return parameters;
    }

    @Test void startUsesRandomStateNonceAndPkceWithoutAuthenticatingApis() throws Exception {
        var first = start();
        var parameters = parameters(first);
        assertThat(parameters.get("state")).isNotBlank();
        assertThat(parameters.get("nonce")).isNotBlank();
        assertThat(parameters.get("code_challenge_method")).isEqualTo("S256");
        assertThat(parameters.get("code_challenge")).hasSize(43);
        assertThat(parameters.get("redirect_uri")).isEqualTo(properties.redirectUri());
        assertThat(parameters(start()).get("state")).isNotEqualTo(parameters.get("state"));
        var session = (MockHttpSession) first.getRequest().getSession(false);
        session.setAttribute("SPRING_SECURITY_CONTEXT", new SecurityContextImpl(new TestingAuthenticationToken("google", "", "ROLE_CUSTOMER")));
        mvc.perform(get("/api/v1/auth/me").session(session)).andExpect(status().isUnauthorized());
    }

    @Test void validSignedOidcCallbackCreatesCookieAndCannotBeReplayed() throws Exception {
        var start = start();
        var parameters = parameters(start);
        provider.token = provider.sign(parameters.get("nonce"), "valid");
        var session = (MockHttpSession) start.getRequest().getSession(false);
        var callback = mvc.perform(get(java.net.URI.create(properties.redirectUri()).getPath()).session(session)
                        .param("code", "test-code").param("state", parameters.get("state"))).andReturn();
        if (!"http://localhost:5173/login?google=success".equals(callback.getResponse().getRedirectedUrl())) {
            var failure = org.mockito.ArgumentCaptor.forClass(org.springframework.security.core.AuthenticationException.class);
            verify(handler).onAuthenticationFailure(any(), any(), failure.capture());
            throw new AssertionError("OIDC callback failure", failure.getValue());
        }
        assertThat(callback.getResponse().getHeaders("Set-Cookie")).anyMatch(cookie -> cookie.contains("m4n_refresh_token=raw-test-refresh"));
        verify(service).signIn(argThat(identity -> identity.emailVerified() && identity.subject().equals("subject")), any(), any());
        assertThat(session.isInvalid()).isTrue();
        mvc.perform(get(java.net.URI.create(properties.redirectUri()).getPath()).param("code", "test-code").param("state", parameters.get("state")))
                .andExpect(redirectedUrl("http://localhost:5173/login?google=failed"));
        verifyNoMoreInteractions(service);
    }

    @Test void missingOrMismatchedStateNeverCallsTokenEndpoint() throws Exception {
        int before = provider.tokenCalls.get();
        var start = start();
        mvc.perform(get(java.net.URI.create(properties.redirectUri()).getPath()).session((MockHttpSession) start.getRequest().getSession(false))
                        .param("code", "fake").param("state", "wrong"))
                .andExpect(redirectedUrl("http://localhost:5173/login?google=failed"));
        mvc.perform(get(java.net.URI.create(properties.redirectUri()).getPath()).param("code", "fake"))
                .andExpect(redirectedUrl("http://localhost:5173/login?google=failed"));
        assertThat(provider.tokenCalls.get()).isEqualTo(before);
        verifyNoInteractions(service);
    }

    @Test void invalidNonceIssuerAudienceExpiryAndSignatureCannotIssueSessions() throws Exception {
        for (String defect : new String[]{"nonce", "issuer", "audience", "expired", "signature"}) {
            var start = start();
            var parameters = parameters(start);
            provider.token = provider.sign(parameters.get("nonce"), defect);
            var response = mvc.perform(get(java.net.URI.create(properties.redirectUri()).getPath())
                            .session((MockHttpSession) start.getRequest().getSession(false))
                            .param("code", "test-code").param("state", parameters.get("state")))
                    .andExpect(redirectedUrl("http://localhost:5173/login?google=failed")).andReturn().getResponse();
            assertThat(response.getHeaders("Set-Cookie")).noneMatch(cookie -> cookie.startsWith("m4n_refresh_token="));
        }
        verifyNoInteractions(service);
    }

    @Configuration
    @EnableWebMvc
    @Import({SecurityConfig.class, GoogleLoginSecurityConfig.class, GoogleLoginHandler.class,
            GoogleLoginProperties.class, GoogleLoginController.class})
    static class Config {
        @Bean GoogleLoginService service() { return mock(GoogleLoginService.class); }
        @Bean JwtService jwtService() { return mock(JwtService.class); }
        @Bean CustomUserDetailsService details() { return mock(CustomUserDetailsService.class); }
        @Bean JwtAuthenticationFilter jwtFilter(JwtService jwt, CustomUserDetailsService details) { return new JwtAuthenticationFilter(jwt, details); }
        @Bean JwtAuthenticationEntryPoint entryPoint() { return new JwtAuthenticationEntryPoint(); }
        @Bean JwtAccessDeniedHandler deniedHandler() { return new JwtAccessDeniedHandler(); }
        @Bean AuthCookieService cookies() { return new AuthCookieService(7, false); }
        @Bean(destroyMethod = "close") Provider provider() throws Exception { return new Provider(); }
        @Bean @Primary ClientRegistrationRepository testProvider(Provider provider, GoogleLoginProperties properties) {
            return new InMemoryClientRegistrationRepository(ClientRegistration.withRegistrationId("google")
                    .clientId("test-client").clientSecret("test-secret").authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                    .redirectUri(properties.redirectUri()).scope("openid", "email", "profile")
                    .authorizationUri("https://accounts.google.com/o/oauth2/v2/auth").tokenUri(provider.origin() + "/token")
                    .jwkSetUri(provider.origin() + "/jwks").issuerUri("https://accounts.google.com")
                    .userNameAttributeName("sub").clientName("Google").build());
        }
    }

    static class Provider implements AutoCloseable {
        final RSAKey key = new RSAKeyGenerator(2048).keyID("test-key").generate();
        final HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        final AtomicInteger tokenCalls = new AtomicInteger();
        volatile String token;

        Provider() throws Exception {
            server.createContext("/jwks", exchange -> {
                byte[] body = new ObjectMapper().writeValueAsBytes(Map.of("keys", java.util.List.of(key.toPublicJWK().toJSONObject())));
                exchange.getResponseHeaders().set("Content-Type", "application/json");
                exchange.sendResponseHeaders(200, body.length);
                try (var stream = exchange.getResponseBody()) { stream.write(body); }
            });
            server.createContext("/token", exchange -> {
                tokenCalls.incrementAndGet();
                String request = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
                assertThat(request).contains("code_verifier=");
                byte[] body = new ObjectMapper().writeValueAsBytes(Map.of("access_token", "test-access", "token_type", "Bearer", "expires_in", 3600, "scope", "openid", "id_token", token));
                exchange.getResponseHeaders().set("Content-Type", "application/json");
                exchange.sendResponseHeaders(200, body.length);
                try (var stream = exchange.getResponseBody()) { stream.write(body); }
            });
            server.start();
        }

        String origin() { return "http://127.0.0.1:" + server.getAddress().getPort(); }
        String sign(String nonce, String defect) throws Exception {
            var claims = new JWTClaimsSet.Builder().issuer(defect.equals("issuer") ? "https://evil.test" : "https://accounts.google.com")
                    .audience(defect.equals("audience") ? "wrong-client" : "test-client").subject("subject")
                    .issueTime(Date.from(Instant.now().minusSeconds(defect.equals("expired") ? 7200 : 5)))
                    .expirationTime(Date.from(Instant.now().plusSeconds(defect.equals("expired") ? -3600 : 3600)))
                    .claim("nonce", defect.equals("nonce") ? "wrong-nonce" : nonce)
                    .claim("email", "customer@gmail.com").claim("email_verified", true).claim("name", "Customer").build();
            var jwt = new SignedJWT(new JWSHeader.Builder(JWSAlgorithm.RS256).keyID("test-key").build(), claims);
            jwt.sign(new RSASSASigner(defect.equals("signature") ? new RSAKeyGenerator(2048).generate() : key));
            return jwt.serialize();
        }
        public void close() { server.stop(0); }
    }
}
