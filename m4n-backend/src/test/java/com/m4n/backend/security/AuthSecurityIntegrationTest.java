package com.m4n.backend.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.m4n.backend.dto.request.LoginRequest;
import com.m4n.backend.dto.request.RegisterRequest;
import com.m4n.backend.dto.request.UpdateProfileRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
class AuthSecurityIntegrationTest {

    @Autowired
    private WebApplicationContext context;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(springSecurity())
                .build();
    }

    @Test
    void shouldRegisterLoginAndAccessMeAndProfile() throws Exception {
        String email = "integration_test_" + System.currentTimeMillis() + "@m4n.vn";
        RegisterRequest registerRequest = new RegisterRequest(
                "Người Dùng Mẫu",
                email,
                "SecurePassword123!",
                "0988776655"
        );

        // 1. Register new Customer
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value(email))
                .andExpect(jsonPath("$.fullName").value("Người Dùng Mẫu"))
                .andExpect(jsonPath("$.role").value("CUSTOMER"))
                .andExpect(jsonPath("$.isActive").value(true));

        // 2. Duplicate registration must fail with 409
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409));

        // 3. Login with bad password must return 401
        LoginRequest badLogin = new LoginRequest(email, "WrongPassword!");
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(badLogin)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid email or password."));

        // 4. Login with unknown email must return 401
        LoginRequest unknownLogin = new LoginRequest("unknown_" + System.currentTimeMillis() + "@m4n.vn", "AnyPassword!");
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(unknownLogin)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid email or password."));

        // 5. Successful login
        LoginRequest validLogin = new LoginRequest(email, "SecurePassword123!");
        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validLogin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.user.email").value(email))
                .andExpect(jsonPath("$.user.role").value("CUSTOMER"))
                .andReturn();

        String responseJson = loginResult.getResponse().getContentAsString();
        String token = objectMapper.readTree(responseJson).get("accessToken").asText();
        assertThat(token).isNotBlank();

        // 6. Access /api/v1/auth/me without token -> 401
        mockMvc.perform(get("/api/v1/auth/me"))
                .andExpect(status().isUnauthorized());

        // 7. Access /api/v1/auth/me with Bearer token -> 200 OK
        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(email))
                .andExpect(jsonPath("$.fullName").value("Người Dùng Mẫu"))
                .andExpect(jsonPath("$.role").value("CUSTOMER"));

        // 8. View profile -> 200 OK
        mockMvc.perform(get("/api/v1/profile")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(email));

        // 9. Update profile -> 200 OK
        UpdateProfileRequest updateRequest = new UpdateProfileRequest(
                "Người Dùng Mới",
                "0999888777",
                "Hà Nội, Việt Nam"
        );
        mockMvc.perform(put("/api/v1/profile")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fullName").value("Người Dùng Mới"))
                .andExpect(jsonPath("$.phone").value("0999888777"))
                .andExpect(jsonPath("$.address").value("Hà Nội, Việt Nam"))
                .andExpect(jsonPath("$.email").value(email));

        // 10. Verify /me reflects updated profile
        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fullName").value("Người Dùng Mới"));
    }

    @Test
    void shouldSeedDevAccountsOnStartup() throws Exception {
        // Test seeded dev admin account login
        LoginRequest adminLogin = new LoginRequest("admin@m4n.vn", "Password123!");
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(adminLogin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.role").value("ADMIN"));

        // Test seeded dev staff account login
        LoginRequest staffLogin = new LoginRequest("staff@m4n.vn", "Password123!");
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(staffLogin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.role").value("ONLINE_STAFF"));

        // Test seeded dev pos account login
        LoginRequest posLogin = new LoginRequest("pos@m4n.vn", "Password123!");
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(posLogin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.role").value("POS_STAFF"));
    }

    @Test
    void shouldRejectRegistrationWhenValidationFails() throws Exception {
        // Short password (< 8 chars)
        RegisterRequest shortPasswordReq = new RegisterRequest(
                "Tên Hợp Lệ",
                "valid.email@m4n.vn",
                "short",
                "0912345678"
        );
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(shortPasswordReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.password").isNotEmpty());

        // Invalid email format
        RegisterRequest badEmailReq = new RegisterRequest(
                "Tên Hợp Lệ",
                "not-an-email",
                "ValidPassword123!",
                "0912345678"
        );
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(badEmailReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.email").isNotEmpty());
    }

    @Test
    void shouldRejectAccessWithMalformedToken() throws Exception {
        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer invalid.jwt.payload.here"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldSupportPatchMappingOnProfile() throws Exception {
        LoginRequest adminLogin = new LoginRequest("admin@m4n.vn", "Password123!");
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(adminLogin)))
                .andExpect(status().isOk())
                .andReturn();

        String token = objectMapper.readTree(result.getResponse().getContentAsString()).get("accessToken").asText();

        UpdateProfileRequest patchRequest = new UpdateProfileRequest(
                "Quản Trị Viên",
                "0900000001",
                "Hà Nội"
        );

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch("/api/v1/profile")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(patchRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fullName").value("Quản Trị Viên"));
    }

    @Test
    void shouldSetHttpOnlyRefreshCookieOnLoginAndRotateOnRefresh() throws Exception {
        LoginRequest loginRequest = new LoginRequest("customer@m4n.vn", "Password123!");
        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(header().exists("Set-Cookie"))
                .andReturn();

        jakarta.servlet.http.Cookie refreshCookie = loginResult.getResponse().getCookie("m4n_refresh_token");
        assertThat(refreshCookie).isNotNull();
        assertThat(refreshCookie.isHttpOnly()).isTrue();
        assertThat(refreshCookie.getPath()).isEqualTo("/api/v1/auth");

        // 1. Refresh with valid cookie -> rotation
        MvcResult refreshResult = mockMvc.perform(post("/api/v1/auth/refresh")
                        .cookie(refreshCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(header().exists("Set-Cookie"))
                .andReturn();

        jakarta.servlet.http.Cookie newRefreshCookie = refreshResult.getResponse().getCookie("m4n_refresh_token");
        assertThat(newRefreshCookie).isNotNull();
        assertThat(newRefreshCookie.getValue()).isNotEqualTo(refreshCookie.getValue());

        // 2. Reusing old refresh token must be rejected with 401 (reuse detection)
        mockMvc.perform(post("/api/v1/auth/refresh")
                        .cookie(refreshCookie))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldRevokeSessionOnLogout() throws Exception {
        LoginRequest loginRequest = new LoginRequest("staff@m4n.vn", "Password123!");
        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn();

        jakarta.servlet.http.Cookie refreshCookie = loginResult.getResponse().getCookie("m4n_refresh_token");
        assertThat(refreshCookie).isNotNull();

        // Logout
        MvcResult logoutResult = mockMvc.perform(post("/api/v1/auth/logout")
                        .cookie(refreshCookie))
                .andExpect(status().isNoContent())
                .andReturn();

        jakarta.servlet.http.Cookie clearedCookie = logoutResult.getResponse().getCookie("m4n_refresh_token");
        assertThat(clearedCookie).isNotNull();
        assertThat(clearedCookie.getMaxAge()).isEqualTo(0);
    }

    @Test
    void shouldHandleForgotPasswordWithGenericResponse() throws Exception {
        com.m4n.backend.dto.request.ForgotPasswordRequest request =
                new com.m4n.backend.dto.request.ForgotPasswordRequest("customer@m4n.vn");

        mockMvc.perform(post("/api/v1/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Nếu địa chỉ email tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu sẽ được gửi."));

        // Non-existent email should also return the same generic message
        com.m4n.backend.dto.request.ForgotPasswordRequest unknownRequest =
                new com.m4n.backend.dto.request.ForgotPasswordRequest("nonexistent_user_999@m4n.vn");

        mockMvc.perform(post("/api/v1/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(unknownRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Nếu địa chỉ email tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu sẽ được gửi."));
    }
}
