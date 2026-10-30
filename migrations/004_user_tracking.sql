-- Signup attribution + activity tracking for the admin dashboard (issue #241).
--
-- signup_source is NULL for users created before this migration, which lets
-- the dashboard tell "pre-tracking" users apart from genuinely direct signups.
-- welcome_sent_at / marketing_opt_out are unused until the welcome email ships.

ALTER TABLE users ADD COLUMN IF NOT EXISTS signup_source VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_referrer TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS utm_source VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS utm_medium VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS utm_campaign VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS welcome_sent_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS marketing_opt_out BOOLEAN NOT NULL DEFAULT FALSE;

-- Default applies to new rows only; existing users keep last_seen_at = NULL
-- rather than all appearing "active today".
ALTER TABLE users ALTER COLUMN last_seen_at SET DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_last_seen_at ON users(last_seen_at);
