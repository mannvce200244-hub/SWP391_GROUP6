package com.m4n.backend.exception;

import com.m4n.backend.config.OpenApiConfig;
import com.m4n.backend.security.SecurityConfig;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest
@Import({SecurityConfig.class, OpenApiConfig.class, GlobalExceptionHandler.class, GlobalExceptionHandlerTest.TestConfig.class})
class GlobalExceptionHandlerTest {

    @TestConfiguration
    static class TestConfig {
        @Bean
        public TestValidationController testValidationController() {
            return new TestValidationController();
        }
    }

    @RestController
    @RequestMapping("/api/v1/test-exceptions")
    static class TestValidationController {

        record TestRequest(@NotBlank(message = "Name must not be blank") String name) {}

        @PostMapping("/validate")
        public String validateInput(@Valid @RequestBody TestRequest request) {
            return "Valid: " + request.name();
        }

        @GetMapping("/not-found")
        public void throwNotFound() {
            throw new ResourceNotFoundException("Resource with ID 999 not found");
        }
    }

    @Autowired
    private MockMvc mockMvc;

    @Test
    @WithMockUser
    void shouldReturnValidationErrorsInApiErrorResponse() throws Exception {
        mockMvc.perform(post("/api/v1/test-exceptions/validate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Bad Request"))
                .andExpect(jsonPath("$.message").value("Request validation failed"))
                .andExpect(jsonPath("$.fieldErrors.name").value("Name must not be blank"))
                .andExpect(jsonPath("$.path").value("/api/v1/test-exceptions/validate"));
    }

    @Test
    @WithMockUser
    void shouldReturnNotFoundInApiErrorResponse() throws Exception {
        mockMvc.perform(get("/api/v1/test-exceptions/not-found"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.error").value("Not Found"))
                .andExpect(jsonPath("$.message").value("Resource with ID 999 not found"))
                .andExpect(jsonPath("$.path").value("/api/v1/test-exceptions/not-found"));
    }
}
