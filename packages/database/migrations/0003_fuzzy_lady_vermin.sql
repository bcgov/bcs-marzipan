CREATE TABLE "date_statuses" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"display_name" varchar(255) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"description" text,
	"created_date_time" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"last_updated_date_time" timestamp with time zone DEFAULT now() NOT NULL,
	"last_updated_by" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "time_statuses" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"display_name" varchar(255) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"description" text,
	"created_date_time" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"last_updated_date_time" timestamp with time zone DEFAULT now() NOT NULL,
	"last_updated_by" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "venue_statuses" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"display_name" varchar(255),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"description" text,
	"created_date_time" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"last_updated_date_time" timestamp with time zone DEFAULT now() NOT NULL,
	"last_updated_by" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "venues" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"display_name" varchar(255) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"address" jsonb,
	"ac_id" varchar(255),
	"created_date_time" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"last_updated_date_time" timestamp with time zone DEFAULT now() NOT NULL,
	"last_updated_by" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activity_additional_owners" (
	"activity_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "activity_additional_owners_activity_id_user_id_pk" PRIMARY KEY("activity_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "activity_field_review_statuses" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "activity_field_review_statuses" CASCADE;--> statement-breakpoint
ALTER TABLE "videographers" RENAME TO "graphics_users";--> statement-breakpoint
ALTER TABLE "system_users" DROP CONSTRAINT "system_users_username_unique";--> statement-breakpoint
ALTER TABLE "activity_can_edit_users" DROP CONSTRAINT "activity_can_edit_users_created_by_system_users_id_fk";
--> statement-breakpoint
ALTER TABLE "activity_can_edit_users" DROP CONSTRAINT "activity_can_edit_users_last_updated_by_system_users_id_fk";
--> statement-breakpoint
ALTER TABLE "activity_can_view_users" DROP CONSTRAINT "activity_can_view_users_created_by_system_users_id_fk";
--> statement-breakpoint
ALTER TABLE "activity_can_view_users" DROP CONSTRAINT "activity_can_view_users_last_updated_by_system_users_id_fk";
--> statement-breakpoint
ALTER TABLE "activity_categories" DROP CONSTRAINT "activity_categories_created_by_system_users_id_fk";
--> statement-breakpoint
ALTER TABLE "activity_categories" DROP CONSTRAINT "activity_categories_last_updated_by_system_users_id_fk";
--> statement-breakpoint
ALTER TABLE "activity_comms_materials" DROP CONSTRAINT "activity_comms_materials_created_by_system_users_id_fk";
--> statement-breakpoint
ALTER TABLE "activity_comms_materials" DROP CONSTRAINT "activity_comms_materials_last_updated_by_system_users_id_fk";
--> statement-breakpoint
ALTER TABLE "activity_joint_event_organizations" DROP CONSTRAINT "activity_joint_event_organizations_created_by_system_users_id_fk";
--> statement-breakpoint
ALTER TABLE "activity_joint_event_organizations" DROP CONSTRAINT "activity_joint_event_organizations_last_updated_by_system_users_id_fk";
--> statement-breakpoint
ALTER TABLE "activity_joint_organizations" DROP CONSTRAINT "activity_joint_organizations_created_by_system_users_id_fk";
--> statement-breakpoint
ALTER TABLE "activity_joint_organizations" DROP CONSTRAINT "activity_joint_organizations_last_updated_by_system_users_id_fk";
--> statement-breakpoint
ALTER TABLE "activity_related_entries" DROP CONSTRAINT "activity_related_entries_created_by_system_users_id_fk";
--> statement-breakpoint
ALTER TABLE "activity_related_entries" DROP CONSTRAINT "activity_related_entries_last_updated_by_system_users_id_fk";
--> statement-breakpoint
ALTER TABLE "activity_representatives" DROP CONSTRAINT "activity_representatives_created_by_system_users_id_fk";
--> statement-breakpoint
ALTER TABLE "activity_representatives" DROP CONSTRAINT "activity_representatives_last_updated_by_system_users_id_fk";
--> statement-breakpoint
ALTER TABLE "activity_shared_with_organizations" DROP CONSTRAINT "activity_shared_with_organizations_created_by_system_users_id_fk";
--> statement-breakpoint
ALTER TABLE "activity_shared_with_organizations" DROP CONSTRAINT "activity_shared_with_organizations_last_updated_by_system_users_id_fk";
--> statement-breakpoint
ALTER TABLE "activity_tags" DROP CONSTRAINT "activity_tags_created_by_system_users_id_fk";
--> statement-breakpoint
ALTER TABLE "activity_tags" DROP CONSTRAINT "activity_tags_last_updated_by_system_users_id_fk";
--> statement-breakpoint
ALTER TABLE "activity_themes" DROP CONSTRAINT "activity_themes_created_by_system_users_id_fk";
--> statement-breakpoint
ALTER TABLE "activity_themes" DROP CONSTRAINT "activity_themes_last_updated_by_system_users_id_fk";
--> statement-breakpoint
ALTER TABLE "activity_translation_languages" DROP CONSTRAINT "activity_translation_languages_created_by_system_users_id_fk";
--> statement-breakpoint
ALTER TABLE "activity_translation_languages" DROP CONSTRAINT "activity_translation_languages_last_updated_by_system_users_id_fk";
--> statement-breakpoint
ALTER TABLE "activities" ALTER COLUMN "display_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "activities" ALTER COLUMN "scheduling_considerations" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "activities" ALTER COLUMN "scheduling_considerations" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "activities" ALTER COLUMN "title" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "activities" ALTER COLUMN "title" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "activities" ALTER COLUMN "summary" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "activities" ALTER COLUMN "summary" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "activities" ALTER COLUMN "venue" SET DATA TYPE varchar(100);--> statement-breakpoint
ALTER TABLE "activities" ALTER COLUMN "significance" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "activities" ALTER COLUMN "significance" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "activities" ALTER COLUMN "entry_status_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "activities" ALTER COLUMN "pitch_status_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "activities" ALTER COLUMN "owner_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "activities" ALTER COLUMN "calendar_visibility" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "activities" ALTER COLUMN "created_date_time" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "activities" ALTER COLUMN "created_date_time" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "activities" ALTER COLUMN "created_by" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "activities" ALTER COLUMN "last_updated_date_time" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "activities" ALTER COLUMN "last_updated_date_time" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "activities" ALTER COLUMN "last_updated_by" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "ministries" ALTER COLUMN "display_name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "ministries" ALTER COLUMN "abbreviation" SET DATA TYPE varchar(10);--> statement-breakpoint
ALTER TABLE "ministries" ALTER COLUMN "abbreviation" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "activity_statuses" ALTER COLUMN "display_name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "categories" ALTER COLUMN "display_name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "cities" ALTER COLUMN "display_name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "lead_org_name" varchar(255);--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "date_status_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "time_status_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "news_release_origin_id" uuid;--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "news_release_origin_name" varchar(255);--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "venue_status_id" integer;--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "event_lead_org_name" varchar(255);--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "not_for_thirty_sixty_ninety" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "ministry_owner_id" uuid;--> statement-breakpoint
ALTER TABLE "system_users" ADD COLUMN "group_id" integer;--> statement-breakpoint
ALTER TABLE "ministries" ADD COLUMN "created_date_time" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "ministries" ADD COLUMN "created_by" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "ministries" ADD COLUMN "last_updated_date_time" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "ministries" ADD COLUMN "last_updated_by" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "created_date_time" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "created_by" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "last_updated_date_time" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "last_updated_by" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "activity_statuses" ADD COLUMN "created_date_time" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "activity_statuses" ADD COLUMN "created_by" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "activity_statuses" ADD COLUMN "last_updated_date_time" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "activity_statuses" ADD COLUMN "last_updated_by" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "pitch_required" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "created_date_time" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "created_by" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "last_updated_date_time" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "last_updated_by" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "cities" ADD COLUMN "created_date_time" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "cities" ADD COLUMN "created_by" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "cities" ADD COLUMN "last_updated_date_time" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "cities" ADD COLUMN "last_updated_by" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "comms_materials" ADD COLUMN "created_date_time" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "comms_materials" ADD COLUMN "created_by" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "comms_materials" ADD COLUMN "last_updated_date_time" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "comms_materials" ADD COLUMN "last_updated_by" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "communication_contacts" ADD COLUMN "created_date_time" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "communication_contacts" ADD COLUMN "created_by" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "communication_contacts" ADD COLUMN "last_updated_date_time" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "communication_contacts" ADD COLUMN "last_updated_by" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "event_planners" ADD COLUMN "created_date_time" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "event_planners" ADD COLUMN "created_by" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "event_planners" ADD COLUMN "last_updated_date_time" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "event_planners" ADD COLUMN "last_updated_by" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "government_representatives" ADD COLUMN "created_date_time" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "government_representatives" ADD COLUMN "created_by" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "government_representatives" ADD COLUMN "last_updated_date_time" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "government_representatives" ADD COLUMN "last_updated_by" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "pitch_statuses" ADD COLUMN "created_date_time" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "pitch_statuses" ADD COLUMN "created_by" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "pitch_statuses" ADD COLUMN "last_updated_date_time" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "pitch_statuses" ADD COLUMN "last_updated_by" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "scheduling_statuses" ADD COLUMN "created_date_time" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "scheduling_statuses" ADD COLUMN "created_by" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "scheduling_statuses" ADD COLUMN "last_updated_date_time" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "scheduling_statuses" ADD COLUMN "last_updated_by" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "tags" ADD COLUMN "created_date_time" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "tags" ADD COLUMN "created_by" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "tags" ADD COLUMN "last_updated_date_time" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "tags" ADD COLUMN "last_updated_by" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "themes" ADD COLUMN "created_date_time" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "themes" ADD COLUMN "created_by" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "themes" ADD COLUMN "last_updated_date_time" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "themes" ADD COLUMN "last_updated_by" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "translated_languages" ADD COLUMN "created_date_time" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "translated_languages" ADD COLUMN "created_by" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "translated_languages" ADD COLUMN "last_updated_date_time" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "translated_languages" ADD COLUMN "last_updated_by" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "graphics_users" ADD COLUMN "created_date_time" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "graphics_users" ADD COLUMN "created_by" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "graphics_users" ADD COLUMN "last_updated_date_time" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "graphics_users" ADD COLUMN "last_updated_by" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "activity_can_edit_users" ADD COLUMN "timestamp" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "activity_can_view_users" ADD COLUMN "timestamp" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "activity_categories" ADD COLUMN "timestamp" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "activity_comms_materials" ADD COLUMN "timestamp" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "activity_joint_event_organizations" ADD COLUMN "timestamp" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "activity_joint_organizations" ADD COLUMN "timestamp" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "activity_related_entries" ADD COLUMN "timestamp" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "activity_representatives" ADD COLUMN "timestamp" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "activity_shared_with_organizations" ADD COLUMN "timestamp" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "activity_tags" ADD COLUMN "timestamp" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "activity_themes" ADD COLUMN "timestamp" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "activity_translation_languages" ADD COLUMN "timestamp" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "date_statuses" ADD CONSTRAINT "date_statuses_created_by_system_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "date_statuses" ADD CONSTRAINT "date_statuses_last_updated_by_system_users_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_statuses" ADD CONSTRAINT "time_statuses_created_by_system_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_statuses" ADD CONSTRAINT "time_statuses_last_updated_by_system_users_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venue_statuses" ADD CONSTRAINT "venue_statuses_created_by_system_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venue_statuses" ADD CONSTRAINT "venue_statuses_last_updated_by_system_users_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venues" ADD CONSTRAINT "venues_created_by_system_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venues" ADD CONSTRAINT "venues_last_updated_by_system_users_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_additional_owners" ADD CONSTRAINT "activity_additional_owners_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_additional_owners" ADD CONSTRAINT "activity_additional_owners_user_id_system_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_lead_org_id_organizations_id_fk" FOREIGN KEY ("lead_org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_pitch_status_id_pitch_statuses_id_fk" FOREIGN KEY ("pitch_status_id") REFERENCES "public"."pitch_statuses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_date_status_id_date_statuses_id_fk" FOREIGN KEY ("date_status_id") REFERENCES "public"."date_statuses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_time_status_id_time_statuses_id_fk" FOREIGN KEY ("time_status_id") REFERENCES "public"."time_statuses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_news_release_origin_id_organizations_id_fk" FOREIGN KEY ("news_release_origin_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_venue_status_id_venue_statuses_id_fk" FOREIGN KEY ("venue_status_id") REFERENCES "public"."venue_statuses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_event_lead_org_id_organizations_id_fk" FOREIGN KEY ("event_lead_org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_event_lead_id_system_users_id_fk" FOREIGN KEY ("event_lead_id") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_graphics_user_id_system_users_id_fk" FOREIGN KEY ("graphics_user_id") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_owner_id_system_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_ministry_owner_id_ministries_id_fk" FOREIGN KEY ("ministry_owner_id") REFERENCES "public"."ministries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_entry_status_id_activity_statuses_id_fk" FOREIGN KEY ("entry_status_id") REFERENCES "public"."activity_statuses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_created_by_system_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_last_updated_by_system_users_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ministries" ADD CONSTRAINT "ministries_contact_user_id_system_users_id_fk" FOREIGN KEY ("contact_user_id") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ministries" ADD CONSTRAINT "ministries_second_contact_user_id_system_users_id_fk" FOREIGN KEY ("second_contact_user_id") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ministries" ADD CONSTRAINT "ministries_created_by_system_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ministries" ADD CONSTRAINT "ministries_last_updated_by_system_users_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_ministry_id_ministries_id_fk" FOREIGN KEY ("ministry_id") REFERENCES "public"."ministries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_created_by_system_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_last_updated_by_system_users_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_statuses" ADD CONSTRAINT "activity_statuses_created_by_system_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_statuses" ADD CONSTRAINT "activity_statuses_last_updated_by_system_users_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_created_by_system_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_last_updated_by_system_users_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cities" ADD CONSTRAINT "cities_created_by_system_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cities" ADD CONSTRAINT "cities_last_updated_by_system_users_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comms_materials" ADD CONSTRAINT "comms_materials_created_by_system_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comms_materials" ADD CONSTRAINT "comms_materials_last_updated_by_system_users_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communication_contacts" ADD CONSTRAINT "communication_contacts_created_by_system_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communication_contacts" ADD CONSTRAINT "communication_contacts_last_updated_by_system_users_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_planners" ADD CONSTRAINT "event_planners_created_by_system_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_planners" ADD CONSTRAINT "event_planners_last_updated_by_system_users_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "government_representatives" ADD CONSTRAINT "government_representatives_created_by_system_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "government_representatives" ADD CONSTRAINT "government_representatives_last_updated_by_system_users_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pitch_statuses" ADD CONSTRAINT "pitch_statuses_created_by_system_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pitch_statuses" ADD CONSTRAINT "pitch_statuses_last_updated_by_system_users_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduling_statuses" ADD CONSTRAINT "scheduling_statuses_created_by_system_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduling_statuses" ADD CONSTRAINT "scheduling_statuses_last_updated_by_system_users_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_created_by_system_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_last_updated_by_system_users_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "themes" ADD CONSTRAINT "themes_created_by_system_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "themes" ADD CONSTRAINT "themes_last_updated_by_system_users_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "translated_languages" ADD CONSTRAINT "translated_languages_created_by_system_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "translated_languages" ADD CONSTRAINT "translated_languages_last_updated_by_system_users_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "graphics_users" ADD CONSTRAINT "graphics_users_created_by_system_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "graphics_users" ADD CONSTRAINT "graphics_users_last_updated_by_system_users_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activity_history_activity_id_timestamp_idx" ON "activity_history" USING btree ("activity_id","timestamp");--> statement-breakpoint
ALTER TABLE "activities" DROP COLUMN "scheduling_status_id";--> statement-breakpoint
ALTER TABLE "activities" DROP COLUMN "comments";--> statement-breakpoint
ALTER TABLE "activities" DROP COLUMN "lead_organization";--> statement-breakpoint
ALTER TABLE "activities" DROP COLUMN "comms_lead_id";--> statement-breakpoint
ALTER TABLE "activities" DROP COLUMN "contact_ministry_id";--> statement-breakpoint
ALTER TABLE "activities" DROP COLUMN "city_id";--> statement-breakpoint
ALTER TABLE "activities" DROP COLUMN "is_time_confirmed";--> statement-breakpoint
ALTER TABLE "activities" DROP COLUMN "is_date_confirmed";--> statement-breakpoint
ALTER TABLE "activities" DROP COLUMN "oic_related";--> statement-breakpoint
ALTER TABLE "activities" DROP COLUMN "planning_report";--> statement-breakpoint
ALTER TABLE "activities" DROP COLUMN "thirty_sixty_ninety_report";--> statement-breakpoint
ALTER TABLE "activities" DROP COLUMN "is_confidential";--> statement-breakpoint
ALTER TABLE "activities" DROP COLUMN "hq_section";--> statement-breakpoint
ALTER TABLE "activities" DROP COLUMN "row_guid";--> statement-breakpoint
ALTER TABLE "system_users" DROP COLUMN "username";--> statement-breakpoint
ALTER TABLE "system_users" DROP COLUMN "first_name";--> statement-breakpoint
ALTER TABLE "system_users" DROP COLUMN "last_name";--> statement-breakpoint
ALTER TABLE "system_users" DROP COLUMN "email";--> statement-breakpoint
ALTER TABLE "system_users" DROP COLUMN "department";--> statement-breakpoint
ALTER TABLE "ministries" DROP COLUMN "parent_id";--> statement-breakpoint
ALTER TABLE "ministries" DROP COLUMN "eod_last_run_user_id";--> statement-breakpoint
ALTER TABLE "ministries" DROP COLUMN "timestamp";--> statement-breakpoint
ALTER TABLE "organizations" DROP COLUMN "timestamp";--> statement-breakpoint
ALTER TABLE "activity_statuses" DROP COLUMN "timestamp";--> statement-breakpoint
ALTER TABLE "categories" DROP COLUMN "pitch_not_required";--> statement-breakpoint
ALTER TABLE "categories" DROP COLUMN "timestamp";--> statement-breakpoint
ALTER TABLE "cities" DROP COLUMN "timestamp";--> statement-breakpoint
ALTER TABLE "comms_materials" DROP COLUMN "timestamp";--> statement-breakpoint
ALTER TABLE "communication_contacts" DROP COLUMN "timestamp";--> statement-breakpoint
ALTER TABLE "event_planners" DROP COLUMN "timestamp";--> statement-breakpoint
ALTER TABLE "government_representatives" DROP COLUMN "timestamp";--> statement-breakpoint
ALTER TABLE "pitch_statuses" DROP COLUMN "timestamp";--> statement-breakpoint
ALTER TABLE "scheduling_statuses" DROP COLUMN "timestamp";--> statement-breakpoint
ALTER TABLE "themes" DROP COLUMN "timestamp";--> statement-breakpoint
ALTER TABLE "translated_languages" DROP COLUMN "timestamp";--> statement-breakpoint
ALTER TABLE "graphics_users" DROP COLUMN "timestamp";--> statement-breakpoint
ALTER TABLE "activity_can_edit_users" DROP COLUMN "created_date_time";--> statement-breakpoint
ALTER TABLE "activity_can_edit_users" DROP COLUMN "created_by";--> statement-breakpoint
ALTER TABLE "activity_can_edit_users" DROP COLUMN "last_updated_date_time";--> statement-breakpoint
ALTER TABLE "activity_can_edit_users" DROP COLUMN "last_updated_by";--> statement-breakpoint
ALTER TABLE "activity_can_view_users" DROP COLUMN "created_date_time";--> statement-breakpoint
ALTER TABLE "activity_can_view_users" DROP COLUMN "created_by";--> statement-breakpoint
ALTER TABLE "activity_can_view_users" DROP COLUMN "last_updated_date_time";--> statement-breakpoint
ALTER TABLE "activity_can_view_users" DROP COLUMN "last_updated_by";--> statement-breakpoint
ALTER TABLE "activity_categories" DROP COLUMN "created_date_time";--> statement-breakpoint
ALTER TABLE "activity_categories" DROP COLUMN "created_by";--> statement-breakpoint
ALTER TABLE "activity_categories" DROP COLUMN "last_updated_date_time";--> statement-breakpoint
ALTER TABLE "activity_categories" DROP COLUMN "last_updated_by";--> statement-breakpoint
ALTER TABLE "activity_comms_materials" DROP COLUMN "created_date_time";--> statement-breakpoint
ALTER TABLE "activity_comms_materials" DROP COLUMN "created_by";--> statement-breakpoint
ALTER TABLE "activity_comms_materials" DROP COLUMN "last_updated_date_time";--> statement-breakpoint
ALTER TABLE "activity_comms_materials" DROP COLUMN "last_updated_by";--> statement-breakpoint
ALTER TABLE "activity_joint_event_organizations" DROP COLUMN "created_date_time";--> statement-breakpoint
ALTER TABLE "activity_joint_event_organizations" DROP COLUMN "created_by";--> statement-breakpoint
ALTER TABLE "activity_joint_event_organizations" DROP COLUMN "last_updated_date_time";--> statement-breakpoint
ALTER TABLE "activity_joint_event_organizations" DROP COLUMN "last_updated_by";--> statement-breakpoint
ALTER TABLE "activity_joint_organizations" DROP COLUMN "created_date_time";--> statement-breakpoint
ALTER TABLE "activity_joint_organizations" DROP COLUMN "created_by";--> statement-breakpoint
ALTER TABLE "activity_joint_organizations" DROP COLUMN "last_updated_date_time";--> statement-breakpoint
ALTER TABLE "activity_joint_organizations" DROP COLUMN "last_updated_by";--> statement-breakpoint
ALTER TABLE "activity_related_entries" DROP COLUMN "created_date_time";--> statement-breakpoint
ALTER TABLE "activity_related_entries" DROP COLUMN "created_by";--> statement-breakpoint
ALTER TABLE "activity_related_entries" DROP COLUMN "last_updated_date_time";--> statement-breakpoint
ALTER TABLE "activity_related_entries" DROP COLUMN "last_updated_by";--> statement-breakpoint
ALTER TABLE "activity_representatives" DROP COLUMN "created_date_time";--> statement-breakpoint
ALTER TABLE "activity_representatives" DROP COLUMN "created_by";--> statement-breakpoint
ALTER TABLE "activity_representatives" DROP COLUMN "last_updated_date_time";--> statement-breakpoint
ALTER TABLE "activity_representatives" DROP COLUMN "last_updated_by";--> statement-breakpoint
ALTER TABLE "activity_shared_with_organizations" DROP COLUMN "created_date_time";--> statement-breakpoint
ALTER TABLE "activity_shared_with_organizations" DROP COLUMN "created_by";--> statement-breakpoint
ALTER TABLE "activity_shared_with_organizations" DROP COLUMN "last_updated_date_time";--> statement-breakpoint
ALTER TABLE "activity_shared_with_organizations" DROP COLUMN "last_updated_by";--> statement-breakpoint
ALTER TABLE "activity_tags" DROP COLUMN "created_date_time";--> statement-breakpoint
ALTER TABLE "activity_tags" DROP COLUMN "created_by";--> statement-breakpoint
ALTER TABLE "activity_tags" DROP COLUMN "last_updated_date_time";--> statement-breakpoint
ALTER TABLE "activity_tags" DROP COLUMN "last_updated_by";--> statement-breakpoint
ALTER TABLE "activity_themes" DROP COLUMN "created_date_time";--> statement-breakpoint
ALTER TABLE "activity_themes" DROP COLUMN "created_by";--> statement-breakpoint
ALTER TABLE "activity_themes" DROP COLUMN "last_updated_date_time";--> statement-breakpoint
ALTER TABLE "activity_themes" DROP COLUMN "last_updated_by";--> statement-breakpoint
ALTER TABLE "activity_translation_languages" DROP COLUMN "created_date_time";--> statement-breakpoint
ALTER TABLE "activity_translation_languages" DROP COLUMN "created_by";--> statement-breakpoint
ALTER TABLE "activity_translation_languages" DROP COLUMN "last_updated_date_time";--> statement-breakpoint
ALTER TABLE "activity_translation_languages" DROP COLUMN "last_updated_by";--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_display_id_unique" UNIQUE("display_id");--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "lead_org_xor" CHECK (("activities"."lead_org_id" IS NULL) <> ("activities"."lead_org_name" IS NULL));--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "event_lead_org_xor" CHECK (("activities"."event_lead_org_id" IS NULL) <> ("activities"."event_lead_org_name" IS NULL));--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "event_lead_xor" CHECK (("activities"."event_lead_id" IS NULL) <> ("activities"."event_lead_name" IS NULL));--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "news_release_origin_xor" CHECK (("activities"."news_release_origin_id" IS NULL) <> ("activities"."news_release_origin_name" IS NULL));