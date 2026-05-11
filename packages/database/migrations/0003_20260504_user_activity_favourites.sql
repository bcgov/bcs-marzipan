-- Migration: add user_activity_favourites table
CREATE TABLE "user_activity_favourites" (
	"user_id" integer NOT NULL,
	"activity_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_activity_favourites_pkey" PRIMARY KEY("user_id","activity_id")
);
--> statement-breakpoint
ALTER TABLE "user_activity_favourites"
  ADD CONSTRAINT "user_activity_favourites_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "user_activity_favourites"
  ADD CONSTRAINT "user_activity_favourites_activity_id_fkey"
  FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE CASCADE;
--> statement-breakpoint
CREATE INDEX "uaf_user_id_idx" ON "user_activity_favourites" ("user_id");
--> statement-breakpoint
CREATE INDEX "uaf_activity_id_idx" ON "user_activity_favourites" ("activity_id");
