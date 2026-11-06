package com.m4n.backend.dto.request;
import jakarta.validation.constraints.*;

public record EmailOtpRequest(
        @NotBlank @Email @Size(max = 255) String email,
        @NotBlank @Pattern(regexp = "REGISTER|RESET_PASSWORD") String purpose) {}
