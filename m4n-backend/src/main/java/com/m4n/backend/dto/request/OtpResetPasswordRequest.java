package com.m4n.backend.dto.request;
import jakarta.validation.constraints.*;

public record OtpResetPasswordRequest(
        @NotBlank @Email @Size(max = 255) String email,
        @NotBlank @Size(max = 36) String challengeId,
        @NotBlank @Pattern(regexp = "[0-9]{6}") String code,
        @NotBlank @Size(min = 8, max = 72) String newPassword,
        @NotBlank @Size(min = 8, max = 72) String confirmPassword) {}
