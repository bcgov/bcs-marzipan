ALTER TABLE "activities" DROP COLUMN "pitch_required_status_id";--> statement-breakpoint
ALTER TABLE "activities" DROP COLUMN "pitch_date";--> statement-breakpoint
ALTER TABLE "pitch_required_statuses" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "pitch_required_statuses";