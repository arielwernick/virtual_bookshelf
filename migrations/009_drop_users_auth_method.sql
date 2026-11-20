-- Sign-in moves to Better Auth (issue #267).
--
-- users_auth_method (from 002) requires password_hash or google_id on every
-- user row. Better Auth keeps passwords and Google ids in auth_accounts and
-- creates the user row before its account row, so every new signup fails
-- while the check exists. Existing rows keep their old columns; #269 removes
-- them once nothing reads them.
--
-- Run the backfill (npm run auth:backfill) again before deploying the
-- cutover, so anyone who signed up since the last run has an account row.

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_auth_method;
