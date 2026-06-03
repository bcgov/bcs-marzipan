-- Migration: create activity_flags table
-- One flag per (activity, team) — tracks which user is assigned to review the activity for that team.
CREATE TABLE "activity_flags" (
  "id" serial PRIMARY KEY NOT NULL,
  "activity_id" integer NOT NULL,
  "team_id" integer NOT NULL,
  "assignee_id" integer NOT NULL,
  "assigned_by_id" integer NOT NULL,
  "note" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "activity_flags_activity_id_team_id_unique" UNIQUE("activity_id","team_id")
);
--> statement-breakpoint
ALTER TABLE "activity_flags" ADD CONSTRAINT "activity_flags_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "activity_flags" ADD CONSTRAINT "activity_flags_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "activity_flags" ADD CONSTRAINT "activity_flags_assignee_id_users_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "activity_flags" ADD CONSTRAINT "activity_flags_assigned_by_id_users_id_fk" FOREIGN KEY ("assigned_by_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
