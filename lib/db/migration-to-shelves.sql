-- Migration: Transform User-based Shelves to User Accounts with Multiple Shelves
-- This script migrates from the old schema where users=shelves to the new schema
-- where users have accounts and can own multiple shelves

-- Step 1: Create the shelves table
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

-- Create indexes on shelves
CREATE INDEX IF NOT EXISTS idx_shelves_user_id ON shelves(user_id);
CREATE INDEX IF NOT EXISTS idx_shelves_share_token ON shelves(share_token);
CREATE INDEX IF NOT EXISTS idx_shelves_user_default ON shelves(user_id, is_default);

-- Step 2: Create trigger for shelves
CREATE TRIGGER update_shelves_updated_at
  BEFORE UPDATE ON shelves
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Step 3: Migrate data - Create a default shelf for each existing user
-- Each existing user gets one shelf named "My Shelf" with their old data
INSERT INTO shelves (user_id, name, share_token, description, is_default, created_at, updated_at)
SELECT 
  id as user_id,
  COALESCE(title, 'My Shelf') as name,
  share_token,
  description,
  true as is_default,
  created_at,
  updated_at
FROM users;

-- Step 4: Add shelf_id column to items table
ALTER TABLE items ADD COLUMN shelf_id UUID;

-- Step 5: Update items to reference the new shelf instead of user
-- Map each item to its user's default shelf
UPDATE items 
SET shelf_id = shelves.id
FROM shelves
WHERE items.user_id = shelves.user_id AND shelves.is_default = true;

-- Step 6: Make shelf_id NOT NULL after data migration
ALTER TABLE items ALTER COLUMN shelf_id SET NOT NULL;

-- Step 7: Add foreign key constraint to items.shelf_id
ALTER TABLE items ADD CONSTRAINT items_shelf_id_fkey FOREIGN KEY (shelf_id) REFERENCES shelves(id) ON DELETE CASCADE;

-- Step 8: Drop old constraints and indexes on items.user_id
ALTER TABLE items DROP CONSTRAINT IF EXISTS items_user_order_unique;
DROP INDEX IF EXISTS idx_items_user_id;
DROP INDEX IF EXISTS idx_items_user_type;
DROP INDEX IF EXISTS idx_items_order;

-- Step 9: Add new constraints and indexes on items.shelf_id
ALTER TABLE items ADD CONSTRAINT items_shelf_order_unique UNIQUE (shelf_id, order_index);
CREATE INDEX IF NOT EXISTS idx_items_shelf_id ON items(shelf_id);
CREATE INDEX IF NOT EXISTS idx_items_shelf_type ON items(shelf_id, type);
CREATE INDEX IF NOT EXISTS idx_items_order ON items(shelf_id, order_index);

-- Step 10: Drop old columns from users table
ALTER TABLE users DROP COLUMN IF EXISTS share_token;
ALTER TABLE users DROP COLUMN IF EXISTS description;
ALTER TABLE users DROP COLUMN IF EXISTS title;

-- Step 11: Finally, drop user_id from items table
ALTER TABLE items DROP COLUMN IF EXISTS user_id;

-- Migration complete!
-- Users now have accounts and can own multiple shelves
-- Each item belongs to a shelf, which belongs to a user
