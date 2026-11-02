-- Additive upgrade: no existing identity is inferred or automatically linked.
BEGIN;
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_subject VARCHAR(255);
CREATE UNIQUE INDEX IF NOT EXISTS ux_users_google_subject ON users (google_subject);
COMMIT;
