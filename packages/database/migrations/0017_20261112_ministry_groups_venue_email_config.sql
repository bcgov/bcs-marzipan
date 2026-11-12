DROP INDEX "ministry_groups_normalized_name_unique";--> statement-breakpoint
DROP INDEX "venue_presets_normalized_address_unique";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "enable_email_notification" SET DEFAULT false;--> statement-breakpoint
CREATE UNIQUE INDEX "ministry_groups_name_lower_unique" ON "ministry_groups" USING btree (lower("name"));