ALTER TABLE "activity_event_planners" DROP CONSTRAINT "activity_event_planners_event_planner_id_event_planners_id_fk";
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_event_planner" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "appears_in_share_with" boolean DEFAULT true NOT NULL;--> statement-breakpoint
UPDATE "teams" SET "appears_in_share_with" = false WHERE "id" BETWEEN 1 AND 7;--> statement-breakpoint
UPDATE "activity_event_planners" aep
SET "event_planner_name" = COALESCE(NULLIF(aep."event_planner_name", ''), ep."display_name"),
    "event_planner_id" = NULL
FROM "event_planners" ep
WHERE aep."event_planner_id" = ep."id";--> statement-breakpoint
ALTER TABLE "activity_event_planners" ADD CONSTRAINT "activity_event_planners_event_planner_id_users_id_fk" FOREIGN KEY ("event_planner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;