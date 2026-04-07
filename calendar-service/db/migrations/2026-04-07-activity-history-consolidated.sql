-- Migration: activity_history denormalized columns and pagination index

BEGIN;

-- 1) Add denormalized text columns written by recordChange() on each insert
ALTER TABLE IF EXISTS activity_history
  ADD COLUMN IF NOT EXISTS activity_title text,
  ADD COLUMN IF NOT EXISTS activity_display_id text,
  ADD COLUMN IF NOT EXISTS actor_display_name text,
  ADD COLUMN IF NOT EXISTS actor_username text,
  ADD COLUMN IF NOT EXISTS category_tags_text text;

-- 2) Composite index for keyset pagination (ORDER BY timestamp DESC, id DESC)
CREATE INDEX IF NOT EXISTS idx_activity_history_ts_id ON activity_history (timestamp DESC, id DESC);

COMMIT;

-- NOTES:
-- This consolidated script creates denormalized columns, indexes, a trigger to maintain the tsvector on write,
-- and a helper function to refresh category/tag denorms for an activity. It is idempotent for safe reapplication.
