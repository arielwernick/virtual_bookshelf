-- NOT VALID: users created through Better Auth have neither column set, so
-- the check only applies to rows written from now on.
ALTER TABLE users ADD CONSTRAINT users_auth_method
  CHECK (password_hash IS NOT NULL OR google_id IS NOT NULL) NOT VALID;
