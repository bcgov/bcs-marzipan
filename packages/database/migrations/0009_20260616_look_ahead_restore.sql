CREATE TABLE "look_ahead_reset_snapshots" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"actor_user_id" integer NOT NULL,
	"trigger" varchar(20) NOT NULL,
	"updated_count" integer NOT NULL,
	"entries" jsonb NOT NULL
);
--> statement-breakpoint
ALTER TABLE "look_ahead_reset_snapshots" ADD CONSTRAINT "look_ahead_reset_snapshots_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
