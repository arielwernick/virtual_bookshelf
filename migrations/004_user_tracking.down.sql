DROP INDEX IF EXISTS idx_users_last_seen_at;
DROP INDEX IF EXISTS idx_users_created_at;

ALTER TABLE users DROP COLUMN IF EXISTS marketing_opt_out;
ALTER TABLE users DROP COLUMN IF EXISTS welcome_sent_at;
ALTER TABLE users DROP COLUMN IF EXISTS last_seen_at;
ALTER TABLE users DROP COLUMN IF EXISTS utm_campaign;
ALTER TABLE users DROP COLUMN IF EXISTS utm_medium;
ALTER TABLE users DROP COLUMN IF EXISTS utm_source;
ALTER TABLE users DROP COLUMN IF EXISTS first_referrer;
ALTER TABLE users DROP COLUMN IF EXISTS signup_source;
