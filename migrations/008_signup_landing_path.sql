-- The first page a new user landed on, recorded at signup.
--
-- The admin dashboard shows where signups come from (referrer, UTM tags) but
-- not which page brought them in. ChatGPT is the main source of signups, and
-- this answers which page it cites. Paths are stored without query strings,
-- and paths that carry a secret (/s/, /embed/, /shelf/, /oauth/) are stored
-- as their prefix only (see cleanLandingPath in lib/utils/attribution.ts).
--
-- Additive and idempotent. The app works before this runs: the value is
-- written in a separate, best-effort statement, and the admin queries read it
-- in a way that returns NULL when the column does not exist.

ALTER TABLE users ADD COLUMN IF NOT EXISTS first_landing_path VARCHAR(200);
