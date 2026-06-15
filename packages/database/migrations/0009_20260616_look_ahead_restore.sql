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
CREATE TABLE "user_activity_favourites" (
	"user_id" integer NOT NULL,
	"activity_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_activity_favourites_user_id_activity_id_pk" PRIMARY KEY("user_id","activity_id")
);
--> statement-breakpoint
CREATE TABLE "user_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"flag_colour" varchar(7),
	"direct_login_enabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_settings_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "permission_visibility_audit" (
	"id" serial PRIMARY KEY NOT NULL,
	"permission_id" integer NOT NULL,
	"changed_by" integer,
	"old_value" boolean NOT NULL,
	"new_value" boolean NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "look_ahead_reset_snapshots" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"actor_user_id" integer NOT NULL,
	"trigger" varchar(20) NOT NULL,
	"updated_count" integer NOT NULL,
	"entries" jsonb NOT NULL
);
--> statement-breakpoint
ALTER TABLE "permissions" ADD COLUMN "show_in_user_management" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "activity_flags" ADD CONSTRAINT "activity_flags_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_flags" ADD CONSTRAINT "activity_flags_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_flags" ADD CONSTRAINT "activity_flags_assignee_id_users_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_flags" ADD CONSTRAINT "activity_flags_assigned_by_id_users_id_fk" FOREIGN KEY ("assigned_by_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_activity_favourites" ADD CONSTRAINT "user_activity_favourites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_activity_favourites" ADD CONSTRAINT "user_activity_favourites_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permission_visibility_audit" ADD CONSTRAINT "permission_visibility_audit_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permission_visibility_audit" ADD CONSTRAINT "permission_visibility_audit_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "look_ahead_reset_snapshots" ADD CONSTRAINT "look_ahead_reset_snapshots_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "uaf_user_id_idx" ON "user_activity_favourites" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "uaf_activity_id_idx" ON "user_activity_favourites" USING btree ("activity_id");