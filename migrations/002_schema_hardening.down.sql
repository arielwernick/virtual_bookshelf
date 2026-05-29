-- Rollback for migration 002: Schema hardening
--
-- Reverts the constraints/NOT NULLs added in 002, returning the schema to the
-- looser 001 (prod-faithful) baseline. Non-destructive to data.

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_auth_method;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_username_lowercase;

ALTER TABLE items ALTER COLUMN shelf_id DROP NOT NULL;
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;
