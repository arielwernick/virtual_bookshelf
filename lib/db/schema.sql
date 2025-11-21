-- Virtual Bookshelf Database Schema
-- Run this in your Neon SQL Editor to set up the database

-- Enable pgcrypto extension for UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create users table (user accounts)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT users_username_lowercase CHECK (username = lower(username))
);

-- Create index on username for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Create shelves table (multiple shelves per user)
CREATE TABLE IF NOT EXISTS shelves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  share_token VARCHAR(50) UNIQUE NOT NULL DEFAULT encode(gen_random_uuid()::text::bytea, 'hex'),
  description TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT shelves_user_name_unique UNIQUE (user_id, name)
);

-- Create indexes on shelves for better query performance
CREATE INDEX IF NOT EXISTS idx_shelves_user_id ON shelves(user_id);
CREATE INDEX IF NOT EXISTS idx_shelves_share_token ON shelves(share_token);
CREATE INDEX IF NOT EXISTS idx_shelves_user_default ON shelves(user_id, is_default);

-- Create items table
CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shelf_id UUID NOT NULL REFERENCES shelves(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('book', 'podcast', 'music')),
  title VARCHAR(255) NOT NULL,
  creator VARCHAR(255) NOT NULL,
  image_url TEXT,
  external_url TEXT,
  notes TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add unique constraint to prevent duplicate order positions per shelf
ALTER TABLE items ADD CONSTRAINT items_shelf_order_unique UNIQUE (shelf_id, order_index);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_items_shelf_id ON items(shelf_id);
CREATE INDEX IF NOT EXISTS idx_items_shelf_type ON items(shelf_id, type);
CREATE INDEX IF NOT EXISTS idx_items_order ON items(shelf_id, order_index);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shelves_updated_at
  BEFORE UPDATE ON shelves
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_items_updated_at
  BEFORE UPDATE ON items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
