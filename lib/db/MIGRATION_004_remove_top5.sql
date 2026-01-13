-- Migration 004: Remove Top 5 Shelf Feature
-- Created: January 13, 2026
-- Description: Removes the Top 5 shelf type, converting all existing top5 shelves to standard
--
-- This migration is IRREVERSIBLE. Once executed, all shelves will be standard type.

-- Step 1: Convert all existing top5 shelves to standard
UPDATE shelves SET shelf_type = 'standard' WHERE shelf_type = 'top5';

-- Step 2: Drop the old constraint and add new one that only allows 'standard'
ALTER TABLE shelves DROP CONSTRAINT IF EXISTS shelves_shelf_type_check;
ALTER TABLE shelves ADD CONSTRAINT shelves_shelf_type_check CHECK (shelf_type = 'standard');

-- Verification query (run after migration to confirm):
-- SELECT COUNT(*) as remaining_top5 FROM shelves WHERE shelf_type != 'standard';
-- Should return 0
