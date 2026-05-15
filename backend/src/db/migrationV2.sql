-- ─────────────────────────────────────────────────────────────────────
-- Migration v2: Email login + OTP verification
-- Run this against your existing database
-- ─────────────────────────────────────────────────────────────────────

-- 1. Add email column to users (nullable first so existing rows don't break)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE,
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT FALSE;

-- If you have existing users you want to keep, set a placeholder and mark verified:
-- UPDATE users SET email = username || '@placeholder.local', is_verified = TRUE WHERE email IS NULL;

-- Once existing rows are backfilled, make email NOT NULL:
-- ALTER TABLE users ALTER COLUMN email SET NOT NULL;

-- 2. OTP verification table
--    purpose: 'register' | 'login' | 'forgot'
CREATE TABLE IF NOT EXISTS otp_verifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  otp         VARCHAR(4) NOT NULL,
  purpose     VARCHAR(10) NOT NULL CHECK (purpose IN ('register', 'login', 'forgot')),
  expires_at  TIMESTAMPTZ NOT NULL,
  used        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otp_user    ON otp_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_otp_expires ON otp_verifications(expires_at);