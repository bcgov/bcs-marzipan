-- Add pg_trgm extension and trigram GIN indexes to improve ILIKE searches
-- Run this migration with your normal migration tooling. Create extension once per DB.
-- Note: CREATE INDEX CONCURRENTLY cannot run inside a transaction block.
-- These indexes are created without CONCURRENTLY so they can run inside a migration transaction.
-- For large tables, consider running these manually during a maintenance window.

CREATE EXTENSION IF NOT EXISTS pg_trgm;
--> statement-breakpoint

-- Activities
CREATE INDEX IF NOT EXISTS idx_activities_title_trgm ON activities USING gin (lower(title) gin_trgm_ops);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_activities_display_id_trgm ON activities USING gin (lower(display_id) gin_trgm_ops);
--> statement-breakpoint

-- Activity history notes
CREATE INDEX IF NOT EXISTS idx_activity_history_notes_trgm ON activity_history USING gin (lower(notes) gin_trgm_ops);
--> statement-breakpoint

-- Users (for display name / username)
CREATE INDEX IF NOT EXISTS idx_users_ad_display_name_trgm ON users USING gin (lower(ad_display_name) gin_trgm_ops);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_users_ad_username_trgm ON users USING gin (lower(ad_username) gin_trgm_ops);
--> statement-breakpoint

-- Categories and Tags used in EXISTS checks
CREATE INDEX IF NOT EXISTS idx_categories_display_name_trgm ON categories USING gin (lower(display_name) gin_trgm_ops);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_tags_display_name_trgm ON tags USING gin (lower(display_name) gin_trgm_ops);
