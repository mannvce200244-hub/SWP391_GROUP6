package com.m4n.backend.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record VerifyResetOtpRequest(
        @NotBlank @Email @Size(max = 255) String email,
        @NotBlank @Size(max = 36) String challengeId,
        @NotBlank @Pattern(regexp = "[0-9]{6}") String code) {}
