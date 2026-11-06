package com.m4n.backend.security;

import com.m4n.backend.config.GoogleLoginProperties;
import com.m4n.backend.service.GoogleLoginService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class GoogleLoginHandler implements AuthenticationSuccessHandler, AuthenticationFailureHandler {
    private final GoogleLoginService googleLogin;
    private final GoogleLoginProperties properties;
    private final AuthCookieService cookies;
    @Value("${m4n.auth.cookie.secure:false}") private boolean cookieSecure;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException {
        try {
            if (!(authentication instanceof OAuth2AuthenticationToken oauth)
                    || !"google".equals(oauth.getAuthorizedClientRegistrationId())
                    || !(oauth.getPrincipal() instanceof OidcUser identity)) {
                finish(request, response, "failed");
                return;
            }
            String refreshToken = googleLogin.signIn(new GoogleLoginService.Identity(identity.getSubject(),
                    identity.getEmail(), identity.getFullName(), Boolean.TRUE.equals(identity.getEmailVerified()),
                    identity.getClaimAsString("hd")), request.getHeader(HttpHeaders.USER_AGENT), request.getRemoteAddr());
            response.addHeader(HttpHeaders.SET_COOKIE, cookies.createRefreshCookie(refreshToken).toString());
            finish(request, response, "success");
        } catch (AuthenticationException | DataIntegrityViolationException | OptimisticLockingFailureException exception) {
            finish(request, response, "not_allowed");
        }
    }

    @Override
    public void onAuthenticationFailure(HttpServletRequest request, HttpServletResponse response, AuthenticationException exception) throws IOException {
        boolean cancelled = exception instanceof OAuth2AuthenticationException oauth
                && "access_denied".equals(oauth.getError().getErrorCode());
        finish(request, response, cancelled ? "cancelled" : "failed");
    }

    private void finish(HttpServletRequest request, HttpServletResponse response, String outcome) throws IOException {
        var session = request.getSession(false);
        if (session != null) session.invalidate();
        SecurityContextHolder.clearContext();
        response.addHeader(HttpHeaders.SET_COOKIE, ResponseCookie.from("m4n_oauth_session", "")
                .httpOnly(true).secure(cookieSecure).path("/").sameSite("Lax").maxAge(0).build().toString());
        response.setHeader(HttpHeaders.CACHE_CONTROL, "no-store");
        response.setHeader("Referrer-Policy", "no-referrer");
        response.sendRedirect(properties.loginUrl(outcome));
    }
}
