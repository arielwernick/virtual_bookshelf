-- Migration 001: Add Google OAuth support and multi-shelf architecture
-- Run this if you have an EXISTING database with the users table

-- Step 0: First, increase share_token column size if it exists
ALTER TABLE users ALTER COLUMN share_token TYPE VARCHAR(128);

-- Step 1: Alter users table to add new columns and constraints
ALTER TABLE users
ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS google_id VARCHAR(100) UNIQUE,
ALTER COLUMN username DROP NOT NULL,
ALTER COLUMN password_hash DROP NOT NULL;

-- Step 2: Generate email for existing users if not present
-- This uses username@localhost as a placeholder
UPDATE users 
SET email = username || '@localhost'
WHERE email IS NULL AND username IS NOT NULL;

-- If any users still don't have email, use google_id or generate a random one
UPDATE users 
SET email = 'user_' || id::text
WHERE email IS NULL;

-- Step 3: Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);

-- Step 4: Add constraint that users must have password OR google_id
-- Note: This requires no existing rows with both NULL
-- The constraint is optional if your data doesn't support it
-- ALTER TABLE users ADD CONSTRAINT users_auth_method CHECK (password_hash IS NOT NULL OR google_id IS NOT NULL);

-- Step 5: Create shelves table
CREATE TABLE IF NOT EXISTS shelves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  share_token VARCHAR(128) UNIQUE NOT NULL DEFAULT encode(gen_random_uuid()::text::bytea, 'hex'),
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 6: Create indexes for shelves
CREATE INDEX IF NOT EXISTS idx_shelves_user_id ON shelves(user_id);
CREATE INDEX IF NOT EXISTS idx_shelves_share_token ON shelves(share_token);

-- Step 7: Alter items table to add shelf_id
ALTER TABLE items
ADD COLUMN IF NOT EXISTS shelf_id UUID REFERENCES shelves(id) ON DELETE CASCADE;

-- Step 8: Create default shelves for existing users
-- This preserves their share tokens by moving them to the shelf level
INSERT INTO shelves (id, user_id, name, share_token, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  users.id,
  COALESCE(users.title, users.username || '''s Shelf'),
  users.share_token,
  users.created_at,
  users.updated_at
FROM users
WHERE NOT EXISTS (SELECT 1 FROM shelves WHERE shelves.user_id = users.id);

-- Step 9: Migrate existing items to default shelves
UPDATE items
SET shelf_id = shelves.id
FROM shelves
WHERE items.user_id = shelves.user_id
AND items.shelf_id IS NULL;

-- Step 10: Update items table constraints to use shelf_id
-- First drop old constraint if it exists
ALTER TABLE items DROP CONSTRAINT IF EXISTS items_user_order_unique;

-- Create new constraint for shelf ordering
ALTER TABLE items ADD CONSTRAINT items_shelf_order_unique UNIQUE (shelf_id, order_index);

-- Step 11: Update item indexes
DROP INDEX IF EXISTS idx_items_user_type;
DROP INDEX IF EXISTS idx_items_order;

CREATE INDEX IF NOT EXISTS idx_items_shelf_id ON items(shelf_id);
CREATE INDEX IF NOT EXISTS idx_items_shelf_type ON items(shelf_id, type);
CREATE INDEX IF NOT EXISTS idx_items_order ON items(shelf_id, order_index);

-- All done! Verify with:
-- SELECT * FROM users LIMIT 1;
-- SELECT * FROM shelves LIMIT 1;
-- SELECT * FROM items LIMIT 1;
