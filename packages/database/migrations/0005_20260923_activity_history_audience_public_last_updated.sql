ALTER TABLE "activities" ADD COLUMN "public_last_updated_by" integer;--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "public_last_updated_date_time" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "activity_history" ADD COLUMN "audience" varchar(20) DEFAULT 'public' NOT NULL;--> statement-breakpoint
UPDATE "activities"
SET
  "public_last_updated_date_time" = "last_updated_date_time",
  "public_last_updated_by" = "last_updated_by";--> statement-breakpoint
ALTER TABLE "activities" ALTER COLUMN "public_last_updated_by" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_public_last_updated_by_users_id_fk" FOREIGN KEY ("public_last_updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
