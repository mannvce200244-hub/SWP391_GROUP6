package com.m4n.backend.security;

import org.springframework.test.context.TestPropertySource;

@TestPropertySource(properties = "m4n.auth.google.redirect-uri=http://localhost:8080/login/oauth2/code/google")
class GoogleLoginLegacyCallbackTest extends GoogleLoginSecurityTest {
}
