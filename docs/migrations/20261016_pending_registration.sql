BEGIN;
-- Existing accounts retain access. Public signup explicitly writes false.
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT TRUE;
UPDATE users SET email_verified = TRUE WHERE email_verified IS NULL;
ALTER TABLE users ALTER COLUMN email_verified SET DEFAULT TRUE;
ALTER TABLE users ALTER COLUMN email_verified SET NOT NULL;
COMMIT;
