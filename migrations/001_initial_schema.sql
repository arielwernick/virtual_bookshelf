-- Migration 001: Initial schema
--
-- Consolidates the full current schema (formerly lib/db/schema.sql plus
-- MIGRATION_001..006) into a single idempotent baseline.
--
-- IDEMPOTENT: this file is safe to run against an empty database (full
-- bootstrap) AND against an existing, already-populated production database
-- (no-op). Every statement is guarded with IF [NOT] EXISTS or a DO block, so
-- re-applying it never errors and never destroys data.

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
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  google_id VARCHAR(100) UNIQUE,
  share_token VARCHAR(128) UNIQUE NOT NULL DEFAULT encode(gen_random_uuid()::text::bytea, 'hex'),
  description TEXT,
  title VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT users_username_lowercase CHECK (username IS NULL OR username = lower(username)),
  CONSTRAINT users_auth_method CHECK (password_hash IS NOT NULL OR google_id IS NOT NULL)
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
  share_token VARCHAR(128) UNIQUE NOT NULL DEFAULT encode(gen_random_uuid()::text::bytea, 'hex'),
  is_public BOOLEAN DEFAULT FALSE,
  shelf_type VARCHAR(20) NOT NULL DEFAULT 'standard' CHECK (shelf_type = 'standard'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shelves_user_id ON shelves(user_id);
CREATE INDEX IF NOT EXISTS idx_shelves_share_token ON shelves(share_token);

-- ---------------------------------------------------------------------------
-- items
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shelf_id UUID NOT NULL REFERENCES shelves(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
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

-- The item-type CHECK is defined as a named constraint so it can be evolved by
-- later migrations. Adding it via a guarded block keeps this file idempotent
-- (ADD CONSTRAINT errors if the constraint already exists).
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

-- Unique (shelf_id, order_index) prevents duplicate ordering positions.
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
