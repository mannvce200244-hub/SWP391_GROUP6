-- Apply before deploying the authentication session invalidation change.
-- Safe for existing populated PostgreSQL users tables and repeat execution.
BEGIN;
ALTER TABLE users ADD COLUMN IF NOT EXISTS session_version BIGINT DEFAULT 0;
UPDATE users SET session_version = 0 WHERE session_version IS NULL;
ALTER TABLE users ALTER COLUMN session_version SET DEFAULT 0;
ALTER TABLE users ALTER COLUMN session_version SET NOT NULL;
COMMIT;
