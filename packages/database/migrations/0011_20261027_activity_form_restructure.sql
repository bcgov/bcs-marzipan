DROP TABLE "pitch_statuses" CASCADE;--> statement-breakpoint
DROP TABLE "activity_report_settings" CASCADE;--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "internal_notes" text;--> statement-breakpoint
ALTER TABLE "activities" DROP COLUMN "strategy";--> statement-breakpoint
ALTER TABLE "activities" DROP COLUMN "news_release_id";
