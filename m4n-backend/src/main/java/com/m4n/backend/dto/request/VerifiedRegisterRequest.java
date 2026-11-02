package com.m4n.backend.dto.request;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

public record VerifiedRegisterRequest(
        @NotNull @Valid RegisterRequest registration,
        @NotBlank @Size(max = 36) String challengeId,
        @NotBlank @Pattern(regexp = "[0-9]{6}") String code) {}
