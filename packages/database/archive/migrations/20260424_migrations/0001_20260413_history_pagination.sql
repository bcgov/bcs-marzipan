CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint
ALTER TABLE "activity_history" ADD COLUMN "activity_title" text;--> statement-breakpoint
ALTER TABLE "activity_history" ADD COLUMN "activity_display_id" text;--> statement-breakpoint
ALTER TABLE "activity_history" ADD COLUMN "actor_display_name" text;--> statement-breakpoint
ALTER TABLE "activity_history" ADD COLUMN "actor_username" text;--> statement-breakpoint
ALTER TABLE "activity_history" ADD COLUMN "category_tags_text" text;--> statement-breakpoint
CREATE INDEX "idx_activities_title_trgm" ON "activities" USING gin (lower("title") gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "idx_activities_display_id_trgm" ON "activities" USING gin (lower("display_id") gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "idx_activity_history_ts_id" ON "activity_history" USING btree ("timestamp","id");--> statement-breakpoint
CREATE INDEX "idx_activity_history_notes_trgm" ON "activity_history" USING gin (lower("notes") gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "idx_users_ad_display_name_trgm" ON "users" USING gin (lower("ad_display_name") gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "idx_users_ad_username_trgm" ON "users" USING gin (lower("ad_username") gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "idx_categories_display_name_trgm" ON "categories" USING gin (lower("display_name") gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "idx_tags_display_name_trgm" ON "tags" USING gin (lower("display_name") gin_trgm_ops);