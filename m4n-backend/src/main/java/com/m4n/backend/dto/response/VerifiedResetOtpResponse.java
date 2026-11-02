package com.m4n.backend.dto.response;

import java.time.Instant;

public record VerifiedResetOtpResponse(String token, Instant expiresAt) {}
