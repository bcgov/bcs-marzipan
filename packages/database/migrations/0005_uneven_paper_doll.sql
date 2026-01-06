CREATE TABLE "ministry_system_users" (
	"ministry_id" uuid NOT NULL,
	"user_id" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ministry_system_users_ministry_id_user_id_pk" PRIMARY KEY("ministry_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "venue_addresses" (
	"id" serial PRIMARY KEY NOT NULL,
	"activity_id" integer NOT NULL,
	"venue_name" varchar(255),
	"street" varchar(255),
	"city" varchar(255),
	"province_or_state" varchar(255),
	"country" varchar(255),
	CONSTRAINT "venue_addresses_activity_id_unique" UNIQUE("activity_id")
);
--> statement-breakpoint
ALTER TABLE "activity_can_edit_users" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "activity_can_view_users" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "activity_can_edit_users" CASCADE;--> statement-breakpoint
DROP TABLE "activity_can_view_users" CASCADE;--> statement-breakpoint
ALTER TABLE "activities" RENAME COLUMN "entry_status_id" TO "activity_status_id";--> statement-breakpoint
ALTER TABLE "activity_shared_with_organizations" RENAME COLUMN "organization_id" TO "ministry_id";--> statement-breakpoint
ALTER TABLE "activities" DROP CONSTRAINT "activities_entry_status_id_activity_statuses_id_fk";
--> statement-breakpoint
ALTER TABLE "activity_shared_with_organizations" DROP CONSTRAINT "activity_shared_with_organizations_organization_id_organizations_id_fk";
--> statement-breakpoint
ALTER TABLE "activity_shared_with_organizations" DROP CONSTRAINT "activity_shared_with_organizations_activity_id_organization_id_pk";--> statement-breakpoint
ALTER TABLE "activities" ALTER COLUMN "display_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "activities" ALTER COLUMN "summary" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "activities" ALTER COLUMN "significance" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "activities" ALTER COLUMN "scheduling_considerations" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "activities" ALTER COLUMN "scheduling_considerations" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "activities" ALTER COLUMN "ministry_owner_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "activity_shared_with_organizations" ADD CONSTRAINT "activity_shared_with_organizations_activity_id_ministry_id_pk" PRIMARY KEY("activity_id","ministry_id");--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "executive_summary" text;--> statement-breakpoint
ALTER TABLE "themes" ADD COLUMN "name" varchar(255);--> statement-breakpoint
UPDATE "themes" SET "name" = LOWER("display_name") WHERE "display_name" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "themes" ALTER COLUMN "name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "ministry_system_users" ADD CONSTRAINT "ministry_system_users_ministry_id_ministries_id_fk" FOREIGN KEY ("ministry_id") REFERENCES "public"."ministries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ministry_system_users" ADD CONSTRAINT "ministry_system_users_user_id_system_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venue_addresses" ADD CONSTRAINT "venue_addresses_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_activity_status_id_activity_statuses_id_fk" FOREIGN KEY ("activity_status_id") REFERENCES "public"."activity_statuses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_shared_with_organizations" ADD CONSTRAINT "activity_shared_with_organizations_ministry_id_ministries_id_fk" FOREIGN KEY ("ministry_id") REFERENCES "public"."ministries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" DROP COLUMN "venue";--> statement-breakpoint
ALTER TABLE "activities" DROP COLUMN "venue_address";--> statement-breakpoint
ALTER TABLE "venues" DROP COLUMN "ac_id";