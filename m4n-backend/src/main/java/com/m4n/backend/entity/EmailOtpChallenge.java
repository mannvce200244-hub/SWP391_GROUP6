package com.m4n.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.Instant;

@Entity
@Table(name = "email_otp_challenges")
@Getter
@Setter
@NoArgsConstructor
public class EmailOtpChallenge {
    @Id
    @Column(length = 64)
    private String id;
    @Column(nullable = false, length = 255)
    private String email;
    @Column(nullable = false, length = 16)
    private String purpose;
    @Column(name = "challenge_id", length = 36)
    private String challengeId;
    @Column(name = "code_hash", length = 100)
    private String codeHash;
    private Instant expiresAt;
    private Instant sentAt;
    private Instant windowStartedAt;
    @Column(nullable = false)
    private int sends;
    @Column(nullable = false)
    private int attempts;
    @Column(nullable = false)
    private boolean consumed;
}
