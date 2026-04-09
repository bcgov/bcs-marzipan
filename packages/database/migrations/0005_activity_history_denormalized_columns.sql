-- Migration: activity_history pagination index

-- Composite index for keyset pagination (ORDER BY timestamp DESC, id DESC)
CREATE INDEX IF NOT EXISTS idx_activity_history_ts_id ON activity_history (timestamp DESC, id DESC);
