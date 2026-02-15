CREATE TABLE "user_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"changed_by_user_id" integer NOT NULL,
	"action_type" varchar(50) NOT NULL,
	"changes" jsonb,
	"notes" text,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_ministries" (
	"team_id" integer NOT NULL,
	"ministry_id" uuid NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "team_ministries_team_id_ministry_id_pk" PRIMARY KEY("team_id","ministry_id")
);
--> statement-breakpoint
ALTER TABLE "user_teams" ADD COLUMN "role" varchar(50) DEFAULT 'member' NOT NULL;--> statement-breakpoint
ALTER TABLE "user_history" ADD CONSTRAINT "user_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_history" ADD CONSTRAINT "user_history_changed_by_user_id_users_id_fk" FOREIGN KEY ("changed_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_ministries" ADD CONSTRAINT "team_ministries_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_ministries" ADD CONSTRAINT "team_ministries_ministry_id_ministries_id_fk" FOREIGN KEY ("ministry_id") REFERENCES "public"."ministries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_history_user_id_idx" ON "user_history" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_history_changed_by_user_id_idx" ON "user_history" USING btree ("changed_by_user_id");--> statement-breakpoint
CREATE INDEX "user_history_timestamp_idx" ON "user_history" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "user_history_user_id_timestamp_idx" ON "user_history" USING btree ("user_id","timestamp");