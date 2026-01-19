-- ============================================================================
-- DEPRECATED: This migration is no longer needed.
-- The Top 5 shelf feature was removed in January 2026.
-- See MIGRATION_004_remove_top5.sql for the migration that removes this feature.
-- This file is kept for historical reference only.
-- ============================================================================

-- Migration 002: Add Top 5 Shelf Support (DEPRECATED)
-- Run this migration on existing databases to add the shelf_type column
-- This is REQUIRED if you have an existing database and want to use Top 5 shelves
--
-- Execute this SQL in your Neon SQL Editor or database client:

-- Add shelf_type column to shelves table
ALTER TABLE shelves 
ADD COLUMN IF NOT EXISTS shelf_type VARCHAR(20) NOT NULL DEFAULT 'standard' 
CHECK (shelf_type IN ('standard', 'top5'));

-- Verify the migration was successful:
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'shelves' AND column_name = 'shelf_type';
