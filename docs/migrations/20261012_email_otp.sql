BEGIN;
CREATE TABLE IF NOT EXISTS email_otp_challenges (
    id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    purpose VARCHAR(16) NOT NULL CHECK (purpose IN ('REGISTER','RESET_PASSWORD')),
    challenge_id VARCHAR(36),
    code_hash VARCHAR(100),
    expires_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    window_started_at TIMESTAMPTZ,
    sends INTEGER NOT NULL DEFAULT 0 CHECK (sends >= 0),
    attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
    consumed BOOLEAN NOT NULL DEFAULT FALSE
);
COMMIT;
