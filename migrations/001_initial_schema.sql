-- Migration 001: Initial schema
--
-- FAITHFUL SNAPSHOT of the production database schema (verified via
-- information_schema introspection). The goal of this baseline is that a
-- freshly bootstrapped database is byte-for-byte structurally identical to
-- production, so ephemeral/test databases (see #147) match prod exactly.
--
-- IMPORTANT: this file intentionally mirrors prod *as it is today*, including
-- a couple of looser-than-ideal definitions (nullable users.email, no FK on
-- items.shelf_id, shelf_type allowing 'top5'). Tightenings live in 002 so the
-- baseline never diverges from reality. Do not "improve" the schema here.
--
-- IDEMPOTENT: safe to run against an empty database (full bootstrap) AND
-- against an existing, already-populated database (no-op). Every statement is
-- guarded with IF [NOT] EXISTS or a DO block.

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE,
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255),
  google_id VARCHAR(100) UNIQUE,
  share_token VARCHAR(128) UNIQUE NOT NULL
    DEFAULT substr(encode(gen_random_uuid()::text::bytea, 'hex'), 1, 64),
  description TEXT,
  title VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);

-- ---------------------------------------------------------------------------
-- shelves
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS shelves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  share_token VARCHAR(128) UNIQUE NOT NULL
    DEFAULT encode(gen_random_uuid()::text::bytea, 'hex'),
  is_public BOOLEAN DEFAULT FALSE,
  shelf_type VARCHAR(20) NOT NULL DEFAULT 'standard'
    CHECK (shelf_type IN ('standard', 'top5')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shelves_user_id ON shelves(user_id);
CREATE INDEX IF NOT EXISTS idx_shelves_share_token ON shelves(share_token);

-- ---------------------------------------------------------------------------
-- items
-- ---------------------------------------------------------------------------
-- NOTE: prod has NO foreign key on items.shelf_id (and 10 orphaned rows), and
-- shelf_id is nullable. Reproduced faithfully here; adding the FK is deferred
-- to a later migration after the orphans are cleaned up (see #150).
CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shelf_id UUID,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL,
  title VARCHAR(255) NOT NULL,
  creator VARCHAR(255) NOT NULL,
  image_url TEXT,
  external_url TEXT,
  notes TEXT,
  rating INTEGER CHECK (rating >= 0 AND rating <= 5),
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Named constraints are added via guarded blocks so the names match prod
-- exactly (ADD CONSTRAINT errors if the constraint already exists).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'items_type_check'
  ) THEN
    ALTER TABLE items ADD CONSTRAINT items_type_check
      CHECK (type IN ('book', 'podcast', 'music', 'podcast_episode', 'video', 'link', 'stock'));
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'items_shelf_order_unique'
  ) THEN
    ALTER TABLE items ADD CONSTRAINT items_shelf_order_unique
      UNIQUE (shelf_id, order_index);
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_items_shelf_id ON items(shelf_id);
CREATE INDEX IF NOT EXISTS idx_items_user_id ON items(user_id);
CREATE INDEX IF NOT EXISTS idx_items_shelf_type ON items(shelf_id, type);
CREATE INDEX IF NOT EXISTS idx_items_order ON items(shelf_id, order_index);
CREATE INDEX IF NOT EXISTS idx_items_type ON items(type);

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- CREATE TRIGGER has no IF NOT EXISTS before PG 14, so drop-then-create keeps
-- this idempotent across versions.
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_shelves_updated_at ON shelves;
CREATE TRIGGER update_shelves_updated_at
  BEFORE UPDATE ON shelves
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_items_updated_at ON items;
CREATE TRIGGER update_items_updated_at
  BEFORE UPDATE ON items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
