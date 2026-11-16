-- Canonical identifiers on items (issue #288).
--
-- An item used to be free text plus two URLs, so nothing could tell that two
-- shelves hold the same book. `source` names the catalogue an identifier
-- comes from (google_books, spotify, youtube, ...) and `source_id` is the
-- identifier in that catalogue. Both are NULL when the item's URL carries no
-- identifier we recognise.
--
-- Numbered 007 because 006 is taken by the Better Auth schema (PR #270).
-- Additive and idempotent: safe to run more than once.

ALTER TABLE items ADD COLUMN IF NOT EXISTS source VARCHAR(32);
ALTER TABLE items ADD COLUMN IF NOT EXISTS source_id VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_items_source_identity
  ON items(source, source_id)
  WHERE source IS NOT NULL;
