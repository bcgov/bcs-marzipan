ALTER TABLE "activities" DROP CONSTRAINT "activities_date_status_id_date_statuses_id_fk";
--> statement-breakpoint
ALTER TABLE "legacy_activities" DROP CONSTRAINT "legacy_activities_matched_activity_id_activities_id_fk";
--> statement-breakpoint
DROP INDEX "legacy_activities_source_unique";--> statement-breakpoint
DROP INDEX "idx_legacy_activities_status_name";--> statement-breakpoint
ALTER TABLE "legacy_activities" ADD COLUMN "display_id" varchar(128) NOT NULL;--> statement-breakpoint
ALTER TABLE "legacy_activities" ADD COLUMN "activity_status_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "legacy_activities" ADD COLUMN "created_date_time" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_date_status_id_date_statuses_id_fk" FOREIGN KEY ("date_status_id") REFERENCES "public"."date_statuses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "legacy_activities" ADD CONSTRAINT "legacy_activities_activity_status_id_activity_statuses_id_fk" FOREIGN KEY ("activity_status_id") REFERENCES "public"."activity_statuses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "legacy_activities_display_id_unique" ON "legacy_activities" USING btree ("display_id");--> statement-breakpoint
CREATE INDEX "idx_legacy_activities_status_id" ON "legacy_activities" USING btree ("activity_status_id");--> statement-breakpoint
ALTER TABLE "legacy_activities" DROP COLUMN "source_system";--> statement-breakpoint
ALTER TABLE "legacy_activities" DROP COLUMN "source_table";--> statement-breakpoint
ALTER TABLE "legacy_activities" DROP COLUMN "source_record_id";--> statement-breakpoint
ALTER TABLE "legacy_activities" DROP COLUMN "matched_activity_id";--> statement-breakpoint
ALTER TABLE "legacy_activities" DROP COLUMN "status_name";--> statement-breakpoint
ALTER TABLE "legacy_activities" DROP COLUMN "is_archived";