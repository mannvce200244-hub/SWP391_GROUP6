package com.m4n.backend.security;

import com.m4n.backend.config.GoogleLoginProperties;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.config.oauth2.client.CommonOAuth2Provider;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.registration.InMemoryClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.DefaultOAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.client.web.HttpSessionOAuth2AuthorizedClientRepository;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestCustomizers;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.context.NullSecurityContextRepository;
import org.springframework.security.web.savedrequest.NullRequestCache;

@Configuration
@ConditionalOnProperty(name = "m4n.auth.google.enabled", havingValue = "true")
public class GoogleLoginSecurityConfig {
    @Bean
    ClientRegistrationRepository googleClientRegistrations(GoogleLoginProperties properties) {
        return new InMemoryClientRegistrationRepository(CommonOAuth2Provider.GOOGLE.getBuilder("google")
                .clientId(properties.clientId()).clientSecret(properties.clientSecret())
                .redirectUri(properties.redirectUri()).scope("openid", "email", "profile").build());
    }

    @Bean
    @Order(1)
    SecurityFilterChain googleLoginFilterChain(HttpSecurity http, ClientRegistrationRepository registrations,
                                              GoogleLoginHandler handler) throws Exception {
        var resolver = new DefaultOAuth2AuthorizationRequestResolver(registrations, "/api/v1/auth/google/authorization");
        resolver.setAuthorizationRequestCustomizer(OAuth2AuthorizationRequestCustomizers.withPkce());
        String callbackPath = java.net.URI.create(registrations.findByRegistrationId("google").getRedirectUri()).getPath();
        http.securityMatcher("/api/v1/auth/google/authorization/**", "/api/v1/auth/google/callback/**", "/login/oauth2/code/google")
                .authorizeHttpRequests(auth -> auth.anyRequest().permitAll())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
                .securityContext(context -> context.securityContextRepository(new NullSecurityContextRepository()))
                .requestCache(cache -> cache.requestCache(new NullRequestCache()))
                .logout(AbstractHttpConfigurer::disable)
                .oauth2Login(oauth -> oauth.clientRegistrationRepository(registrations)
                        .authorizedClientRepository(new HttpSessionOAuth2AuthorizedClientRepository())
                        .authorizationEndpoint(endpoint -> endpoint.authorizationRequestResolver(resolver))
                        .redirectionEndpoint(endpoint -> endpoint.baseUri(callbackPath))
                        .successHandler(handler).failureHandler(handler));
        return http.build();
    }
}
