CREATE TABLE "team_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"changed_by_user_id" integer NOT NULL,
	"action_type" varchar(50) NOT NULL,
	"changes" jsonb,
	"notes" text,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "team_history" ADD CONSTRAINT "team_history_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_history" ADD CONSTRAINT "team_history_changed_by_user_id_users_id_fk" FOREIGN KEY ("changed_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "team_history_team_id_idx" ON "team_history" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "team_history_changed_by_user_id_idx" ON "team_history" USING btree ("changed_by_user_id");--> statement-breakpoint
CREATE INDEX "team_history_timestamp_idx" ON "team_history" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "team_history_team_id_timestamp_idx" ON "team_history" USING btree ("team_id","timestamp");