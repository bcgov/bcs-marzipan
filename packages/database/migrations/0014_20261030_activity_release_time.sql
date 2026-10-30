ALTER TABLE "activities" ADD COLUMN "release_time_offset_minutes" integer;--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "release_time" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "activities" DROP COLUMN "news_release_date_time";