-- MIGRATION_006_stock_type.sql
-- Add 'stock' to items type constraint
--
-- Run this migration in Neon Console BEFORE deploying code changes
-- that reference the 'stock' item type.
--
-- Date: March 2026

-- Step 1: Drop existing constraint
ALTER TABLE items DROP CONSTRAINT items_type_check;

-- Step 2: Add new constraint with 'stock' type included
ALTER TABLE items ADD CONSTRAINT items_type_check
  CHECK (type IN ('book', 'podcast', 'music', 'podcast_episode', 'video', 'link', 'stock'));

-- Verification: Check that constraint was applied
-- SELECT conname, pg_get_constraintdef(oid)
-- FROM pg_constraint
-- WHERE conname = 'items_type_check';
