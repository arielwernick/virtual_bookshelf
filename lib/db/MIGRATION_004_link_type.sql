-- MIGRATION_004_link_type.sql
-- Add 'link' to items type constraint
-- 
-- Run this migration in Neon Console BEFORE deploying code changes
-- that reference the 'link' item type.
--
-- Date: January 2026

-- Step 1: Drop existing constraint
ALTER TABLE items DROP CONSTRAINT items_type_check;

-- Step 2: Add new constraint with 'link' type included
ALTER TABLE items ADD CONSTRAINT items_type_check 
  CHECK (type IN ('book', 'podcast', 'music', 'podcast_episode', 'video', 'link'));

-- Verification: Check that constraint was applied
-- SELECT conname, pg_get_constraintdef(oid) 
-- FROM pg_constraint 
-- WHERE conname = 'items_type_check';
