-- Add pg_trgm extension and trigram GIN indexes to improve ILIKE searches
-- Run this migration with your normal migration tooling. Create extension once per DB.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Activities
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activities_title_trgm ON activities USING gin (lower(title) gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activities_display_id_trgm ON activities USING gin (lower(display_id) gin_trgm_ops);

-- Activity history notes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activity_history_notes_trgm ON activity_history USING gin (lower(notes) gin_trgm_ops);

-- Users (for display name / username)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_ad_display_name_trgm ON users USING gin (lower(ad_display_name) gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_ad_username_trgm ON users USING gin (lower(ad_username) gin_trgm_ops);

-- Categories and Tags used in EXISTS checks
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_categories_display_name_trgm ON categories USING gin (lower(display_name) gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tags_display_name_trgm ON tags USING gin (lower(display_name) gin_trgm_ops);

-- If your DB is large, run these in maintenance windows; CONCURRENTLY avoids long locks but still requires time.
