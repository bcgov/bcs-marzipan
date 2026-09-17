CREATE INDEX IF NOT EXISTS "idx_activity_history_changes_gin"
  ON "activity_history" USING gin ("changes" jsonb_path_ops);
