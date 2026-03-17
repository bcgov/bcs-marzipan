-- Create activity_event_planners junction table for multiple event planners per activity
CREATE TABLE "activity_event_planners" (
	"id" serial PRIMARY KEY NOT NULL,
	"activity_id" integer NOT NULL,
	"event_planner_lead_id" integer,
	"event_planner_lead_name" varchar(255),
	"is_active" boolean DEFAULT true NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- Backfill from activities: one row per activity that had a planner
INSERT INTO "activity_event_planners" ("activity_id", "event_planner_lead_id", "event_planner_lead_name", "is_active", "timestamp")
SELECT "id", "event_planner_lead_id", "event_planner_lead_name", true, now()
FROM "activities"
WHERE "event_planner_lead_id" IS NOT NULL OR "event_planner_lead_name" IS NOT NULL;
--> statement-breakpoint
-- Drop event planner columns from activities
ALTER TABLE "activities" DROP CONSTRAINT IF EXISTS "event_planner_lead_at_most_one";
--> statement-breakpoint
ALTER TABLE "activities" DROP COLUMN IF EXISTS "event_planner_lead_id";
--> statement-breakpoint
ALTER TABLE "activities" DROP COLUMN IF EXISTS "event_planner_lead_name";
--> statement-breakpoint
ALTER TABLE "activity_event_planners" ADD CONSTRAINT "activity_event_planners_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "activity_event_planners" ADD CONSTRAINT "activity_event_planners_event_planner_lead_id_event_planners_id_fk" FOREIGN KEY ("event_planner_lead_id") REFERENCES "public"."event_planners"("id") ON DELETE no action ON UPDATE no action;
