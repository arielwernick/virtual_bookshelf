-- Migration 002: Schema hardening
--
-- Adds integrity constraints the application already assumes but which are
-- missing from the production schema. Each tightening below was validated to
-- have ZERO violating rows in production at authoring time:
--   - users.email IS NULL                          -> 0 rows
--   - items.shelf_id IS NULL                        -> 0 rows
--   - username <> lower(username)                   -> 0 rows
--   - users with neither password_hash nor google_id-> 0 rows
--
-- DEFERRED (NOT applied here) because prod data currently violates them:
--   - FK items.shelf_id -> shelves(id): 10 orphaned items exist (clean up first)
--   - shelf_type = 'standard' only: 4 'top5' shelves still exist (see #110)
--
-- Re-validate against the target database (ideally a Neon branch) before
-- applying to production — see #150 / #147. Idempotent and transactional.

-- users.email NOT NULL
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users'
      AND column_name = 'email' AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE users ALTER COLUMN email SET NOT NULL;
  END IF;
END
$$;

-- items.shelf_id NOT NULL (an item must belong to a shelf)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'items'
      AND column_name = 'shelf_id' AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE items ALTER COLUMN shelf_id SET NOT NULL;
  END IF;
END
$$;

-- usernames are stored lowercase
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_username_lowercase'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_username_lowercase
      CHECK (username IS NULL OR username = lower(username));
  END IF;
END
$$;

-- every user must have at least one auth method
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_auth_method'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_auth_method
      CHECK (password_hash IS NOT NULL OR google_id IS NOT NULL);
  END IF;
END
$$;
