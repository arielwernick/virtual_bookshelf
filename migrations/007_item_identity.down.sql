DROP INDEX IF EXISTS idx_items_source_identity;
ALTER TABLE items DROP COLUMN IF EXISTS source_id;
ALTER TABLE items DROP COLUMN IF EXISTS source;
