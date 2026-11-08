-- Better Auth schema (issue #265).
--
-- Better Auth reuses the existing `users` table and adds three tables of its
-- own, prefixed `auth_` so they read apart from the app's tables:
--   auth_sessions       one row per signed-in browser (replaces the JWT cookie)
--   auth_accounts       one row per sign-in method: 'credential' (email and
--                       password, holding the bcrypt hash) or 'google'
--   auth_verifications  short-lived tokens for email verification and resets
--
-- Nothing reads these tables until the cutover (#267). Existing users get
-- their account rows from the backfill (#266).
--
-- users.password_hash, users.google_id and the users_auth_method constraint
-- stay for now: the current sign-in code still writes them. They are removed
-- once nothing reads them (#269).
--
-- IDs are UUIDs from gen_random_uuid(), matching users.id; Better Auth is
-- configured with generateId: 'uuid' so it leaves ID creation to Postgres.

-- ---------------------------------------------------------------------------
-- users: fields Better Auth needs
-- ---------------------------------------------------------------------------
-- display_name is Better Auth's `name`. It is private until the curator
-- decision says how (and whether) it is shown on public shelves.
ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS image TEXT;

-- ---------------------------------------------------------------------------
-- auth_sessions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS auth_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id ON auth_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires_at ON auth_sessions(expires_at);

-- ---------------------------------------------------------------------------
-- auth_accounts
-- ---------------------------------------------------------------------------
-- account_id is the provider's ID for the user: the Google `sub` for 'google',
-- and the user's own ID for 'credential'.
CREATE TABLE IF NOT EXISTS auth_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  id_token TEXT,
  access_token_expires_at TIMESTAMPTZ,
  refresh_token_expires_at TIMESTAMPTZ,
  scope TEXT,
  password TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT auth_accounts_provider_account_unique UNIQUE (provider_id, account_id)
);

CREATE INDEX IF NOT EXISTS idx_auth_accounts_user_id ON auth_accounts(user_id);

-- ---------------------------------------------------------------------------
-- auth_verifications
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS auth_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_verifications_identifier ON auth_verifications(identifier);
