-- Enforce one account per email, including unverified/disabled accounts.
-- Conflicting historical rows stop this upgrade; do not merge/delete accounts.
BEGIN;
CREATE UNIQUE INDEX IF NOT EXISTS uq_users_email_normalized
    ON users (LOWER(BTRIM(email)));
COMMIT;
