package com.m4n.backend.dto.response;
import java.time.Instant;

public record EmailOtpResponse(String challengeId, Instant expiresAt, Instant resendAt, String message) {}
