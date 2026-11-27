ALTER TABLE "user_settings" RENAME COLUMN "flag_colour" TO "user_colour_key";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "display_name" varchar(255);--> statement-breakpoint
CREATE INDEX "idx_users_display_name_trgm" ON "users" USING gin (lower("display_name") gin_trgm_ops);