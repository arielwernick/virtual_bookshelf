-- Migration 003: Add Podcast Episode Support
-- Run this migration on existing databases to add 'podcast_episode' to the items type constraint
-- This is REQUIRED if you have an existing database and want to use podcast episodes
--
-- Execute this SQL in your Neon SQL Editor or database client:

-- Drop the existing constraint
ALTER TABLE items DROP CONSTRAINT IF EXISTS items_type_check;

-- Add the new constraint with podcast_episode support
ALTER TABLE items 
ADD CONSTRAINT items_type_check 
CHECK (type IN ('book', 'podcast', 'music', 'podcast_episode'));

-- Verify the migration was successful by checking the constraint:
-- SELECT conname, pg_get_constraintdef(oid) as definition
-- FROM pg_constraint 
-- WHERE conrelid = 'items'::regclass 
-- AND conname = 'items_type_check';

-- To rollback this migration (if needed):
-- ALTER TABLE items DROP CONSTRAINT IF EXISTS items_type_check;
-- ALTER TABLE items ADD CONSTRAINT items_type_check CHECK (type IN ('book', 'podcast', 'music'));