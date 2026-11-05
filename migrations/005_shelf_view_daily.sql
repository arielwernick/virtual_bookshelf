-- Daily view counters for public shelves and embeds (issue #248).
--
-- One row per shelf, UTC day, surface and embedding site. Each counted view
-- bumps `views` on its row, so nothing about the individual viewer (IP,
-- user-agent, full referrer URL) is ever stored. embed_host is '' for
-- surface = 'shelf' because primary key columns can't be NULL.

CREATE TABLE IF NOT EXISTS shelf_view_daily (
  shelf_id   UUID NOT NULL REFERENCES shelves(id) ON DELETE CASCADE,
  day        DATE NOT NULL,
  surface    VARCHAR(10) NOT NULL CHECK (surface IN ('shelf', 'embed')),
  embed_host VARCHAR(255) NOT NULL DEFAULT '',
  views      INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (shelf_id, day, surface, embed_host)
);

CREATE INDEX IF NOT EXISTS idx_shelf_view_daily_day ON shelf_view_daily(day);
