CREATE TABLE "activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"display_id" varchar(50),
	"is_active" boolean DEFAULT true NOT NULL,
	"title" varchar(255) NOT NULL,
	"lead_org_id" uuid,
	"lead_org_name" varchar(255),
	"summary" text NOT NULL,
	"significance" text NOT NULL,
	"is_issue" boolean DEFAULT false NOT NULL,
	"is_all_day" boolean DEFAULT false NOT NULL,
	"start_date" date,
	"end_date" date,
	"date_status_id" integer NOT NULL,
	"start_time" time,
	"end_time" time,
	"time_status_id" integer NOT NULL,
	"scheduling_notes" text,
	"strategy" text,
	"news_release_origin_id" integer,
	"news_release_id" uuid,
	"news_release_date_time" timestamp with time zone,
	"event_planner_lead_id" integer,
	"event_planner_lead_name" varchar(255),
	"executive_summary" text,
	"look_ahead_status" varchar(50),
	"look_ahead_section" varchar(50),
	"is_confidential" boolean DEFAULT false NOT NULL,
	"notes" text,
	"pitch_date" date,
	"news_release_distribution_id" integer,
	"premier_requested_id" integer,
	"visibility" varchar(50) DEFAULT 'global' NOT NULL,
	"comms_contact_lead_id" integer NOT NULL,
	"contact_ministry_id" uuid NOT NULL,
	"activity_status_id" integer NOT NULL,
	"created_by" integer NOT NULL,
	"last_updated_by" integer NOT NULL,
	"created_date_time" timestamp with time zone DEFAULT now() NOT NULL,
	"last_updated_date_time" timestamp with time zone DEFAULT now() NOT NULL,
	"row_version" bigint DEFAULT 0 NOT NULL,
	"row_guid" uuid DEFAULT gen_random_uuid() NOT NULL,
	CONSTRAINT "activities_display_id_unique" UNIQUE("display_id"),
	CONSTRAINT "lead_org_xor" CHECK (("activities"."lead_org_id" IS NULL) <> ("activities"."lead_org_name" IS NULL)),
	CONSTRAINT "event_planner_lead_xor" CHECK (("activities"."event_planner_lead_id" IS NULL) <> ("activities"."event_planner_lead_name" IS NULL))
);
--> statement-breakpoint
CREATE TABLE "activity_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"activity_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"action_type" varchar(50) NOT NULL,
	"changes" jsonb,
	"notes" text,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "system_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"role" varchar(50) DEFAULT 'ReadOnly' NOT NULL,
	"group_id" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"external_id" varchar(255),
	"ad_username" varchar(255),
	"ad_display_name" varchar(255),
	"ad_email" varchar(255),
	"ad_phone" varchar(50),
	"ad_division" varchar(255),
	"ad_department" varchar(255),
	"ad_job_title" varchar(255),
	"phone" varchar(50),
	"notes" text,
	"last_login_date_time" timestamp with time zone,
	"created_date_time" timestamp with time zone,
	"created_by" integer,
	"last_updated_date_time" timestamp with time zone,
	"last_updated_by" integer,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ministries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sort_order" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"display_name" varchar(255) NOT NULL,
	"abbreviation" varchar(10) NOT NULL,
	"minister_name" varchar(255),
	"contact_user_id" integer,
	"second_contact_user_id" integer,
	"created_date_time" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"last_updated_date_time" timestamp with time zone DEFAULT now() NOT NULL,
	"last_updated_by" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pod_ministries" (
	"pod_id" integer NOT NULL,
	"ministry_id" uuid NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pod_ministries_pod_id_ministry_id_pk" PRIMARY KEY("pod_id","ministry_id")
);
--> statement-breakpoint
CREATE TABLE "pod_shared_with_teams" (
	"pod_id" integer NOT NULL,
	"team_id" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pod_shared_with_teams_pod_id_team_id_pk" PRIMARY KEY("pod_id","team_id")
);
--> statement-breakpoint
CREATE TABLE "pods" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" varchar(500),
	"visibility" varchar(50) DEFAULT 'private' NOT NULL,
	"created_by" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_date_time" timestamp with time zone DEFAULT now() NOT NULL,
	"last_updated_date_time" timestamp with time zone DEFAULT now() NOT NULL,
	"last_updated_by" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"display_name" varchar(255),
	"organization_type" varchar(50),
	"ministry_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"description" text,
	"created_date_time" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"last_updated_date_time" timestamp with time zone DEFAULT now() NOT NULL,
	"last_updated_by" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activity_filters" (
	"id" serial PRIMARY KEY NOT NULL,
	"query_string" varchar(300),
	"name" varchar(200),
	"sort_order" integer,
	"is_active" boolean,
	"created_date_time" timestamp with time zone,
	"created_by" integer,
	"last_updated_date_time" timestamp with time zone,
	"last_updated_by" integer,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"row_guid" uuid
);
--> statement-breakpoint
CREATE TABLE "activity_statuses" (
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
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"display_name" varchar(255) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"pitch_required" boolean DEFAULT false NOT NULL,
	"visibility" varchar(50) DEFAULT 'global' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"description" text,
	"created_date_time" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"last_updated_date_time" timestamp with time zone DEFAULT now() NOT NULL,
	"last_updated_by" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cities" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"display_name" varchar(255) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"province" varchar(100),
	"created_date_time" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"last_updated_date_time" timestamp with time zone DEFAULT now() NOT NULL,
	"last_updated_by" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comms_materials" (
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
CREATE TABLE "communication_contacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"display_name" varchar(255),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"email" varchar(255),
	"phone" varchar(50),
	"created_date_time" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"last_updated_date_time" timestamp with time zone DEFAULT now() NOT NULL,
	"last_updated_by" integer NOT NULL
);
--> statement-breakpoint
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
CREATE TABLE "event_planners" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"display_name" varchar(255),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"email" varchar(255),
	"phone" varchar(50),
	"created_date_time" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"last_updated_date_time" timestamp with time zone DEFAULT now() NOT NULL,
	"last_updated_by" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "government_representatives" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"display_name" varchar(255),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"title" varchar(255),
	"ministry_id" uuid,
	"representative_type" varchar(50),
	"created_date_time" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"last_updated_date_time" timestamp with time zone DEFAULT now() NOT NULL,
	"last_updated_by" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "news_release_distributions" (
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
CREATE TABLE "news_release_origins" (
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
CREATE TABLE "pitch_statuses" (
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
CREATE TABLE "premier_requested" (
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
CREATE TABLE "reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"display_name" varchar(255) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"visibility" varchar(50) DEFAULT 'team' NOT NULL,
	"config" jsonb,
	"description" text,
	"created_date_time" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"last_updated_date_time" timestamp with time zone DEFAULT now() NOT NULL,
	"last_updated_by" integer NOT NULL,
	CONSTRAINT "reports_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "sectors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
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
CREATE TABLE "tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"display_name" varchar(255),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"visibility" varchar(50) DEFAULT 'global' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"description" text,
	"created_date_time" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"last_updated_date_time" timestamp with time zone DEFAULT now() NOT NULL,
	"last_updated_by" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "themes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(100),
	"name" varchar(255) NOT NULL,
	"display_name" varchar(255),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"top_release_id" uuid,
	"feature_release_id" uuid,
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
CREATE TABLE "translated_languages" (
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
	"created_date_time" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"last_updated_date_time" timestamp with time zone DEFAULT now() NOT NULL,
	"last_updated_by" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activity_additional_comms_contacts" (
	"activity_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "activity_additional_comms_contacts_activity_id_user_id_pk" PRIMARY KEY("activity_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "activity_categories" (
	"activity_id" integer NOT NULL,
	"category_id" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "activity_categories_activity_id_category_id_pk" PRIMARY KEY("activity_id","category_id")
);
--> statement-breakpoint
CREATE TABLE "activity_comms_materials" (
	"activity_id" integer NOT NULL,
	"comms_material_id" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "activity_comms_materials_activity_id_comms_material_id_pk" PRIMARY KEY("activity_id","comms_material_id")
);
--> statement-breakpoint
CREATE TABLE "activity_report_settings" (
	"activity_id" integer NOT NULL,
	"report_id" integer NOT NULL,
	"omitted" boolean DEFAULT false NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "activity_report_settings_activity_id_report_id_pk" PRIMARY KEY("activity_id","report_id")
);
--> statement-breakpoint
CREATE TABLE "activity_representatives" (
	"id" serial PRIMARY KEY NOT NULL,
	"activity_id" integer NOT NULL,
	"representative_id" integer,
	"representative_name" varchar(255),
	"is_active" boolean DEFAULT true NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activity_sectors" (
	"activity_id" integer NOT NULL,
	"sector_id" uuid NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "activity_sectors_activity_id_sector_id_pk" PRIMARY KEY("activity_id","sector_id")
);
--> statement-breakpoint
CREATE TABLE "activity_shared_with_teams" (
	"activity_id" integer NOT NULL,
	"team_id" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "activity_shared_with_teams_activity_id_team_id_pk" PRIMARY KEY("activity_id","team_id")
);
--> statement-breakpoint
CREATE TABLE "activity_subscriptions" (
	"activity_id" integer NOT NULL,
	"tag_id" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "activity_subscriptions_activity_id_tag_id_pk" PRIMARY KEY("activity_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "activity_tags" (
	"activity_id" integer NOT NULL,
	"tag_id" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "activity_tags_activity_id_tag_id_pk" PRIMARY KEY("activity_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "activity_themes" (
	"activity_id" integer NOT NULL,
	"theme_id" uuid NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "activity_themes_activity_id_theme_id_pk" PRIMARY KEY("activity_id","theme_id")
);
--> statement-breakpoint
CREATE TABLE "activity_translation_languages" (
	"activity_id" integer NOT NULL,
	"language_id" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "activity_translation_languages_activity_id_language_id_pk" PRIMARY KEY("activity_id","language_id")
);
--> statement-breakpoint
CREATE TABLE "favorite_activities" (
	"system_user_id" integer NOT NULL,
	"activity_id" integer NOT NULL,
	CONSTRAINT "favorite_activities_system_user_id_activity_id_pk" PRIMARY KEY("system_user_id","activity_id")
);
--> statement-breakpoint
CREATE TABLE "ministry_system_users" (
	"ministry_id" uuid NOT NULL,
	"user_id" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ministry_system_users_ministry_id_user_id_pk" PRIMARY KEY("ministry_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "team_categories" (
	"category_id" integer NOT NULL,
	"team_id" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "team_categories_category_id_team_id_pk" PRIMARY KEY("category_id","team_id")
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"display_name" varchar(255),
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_date_time" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"last_updated_date_time" timestamp with time zone DEFAULT now() NOT NULL,
	"last_updated_by" integer NOT NULL
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
ALTER TABLE "activities" ADD CONSTRAINT "activities_lead_org_id_organizations_id_fk" FOREIGN KEY ("lead_org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_date_status_id_date_statuses_id_fk" FOREIGN KEY ("date_status_id") REFERENCES "public"."date_statuses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_time_status_id_time_statuses_id_fk" FOREIGN KEY ("time_status_id") REFERENCES "public"."time_statuses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_news_release_origin_id_news_release_origins_id_fk" FOREIGN KEY ("news_release_origin_id") REFERENCES "public"."news_release_origins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_event_planner_lead_id_event_planners_id_fk" FOREIGN KEY ("event_planner_lead_id") REFERENCES "public"."event_planners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_news_release_distribution_id_news_release_distributions_id_fk" FOREIGN KEY ("news_release_distribution_id") REFERENCES "public"."news_release_distributions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_premier_requested_id_premier_requested_id_fk" FOREIGN KEY ("premier_requested_id") REFERENCES "public"."premier_requested"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_comms_contact_lead_id_system_users_id_fk" FOREIGN KEY ("comms_contact_lead_id") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_contact_ministry_id_ministries_id_fk" FOREIGN KEY ("contact_ministry_id") REFERENCES "public"."ministries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_activity_status_id_activity_statuses_id_fk" FOREIGN KEY ("activity_status_id") REFERENCES "public"."activity_statuses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_created_by_system_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_last_updated_by_system_users_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_history" ADD CONSTRAINT "activity_history_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_history" ADD CONSTRAINT "activity_history_user_id_system_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ministries" ADD CONSTRAINT "ministries_contact_user_id_system_users_id_fk" FOREIGN KEY ("contact_user_id") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ministries" ADD CONSTRAINT "ministries_second_contact_user_id_system_users_id_fk" FOREIGN KEY ("second_contact_user_id") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ministries" ADD CONSTRAINT "ministries_created_by_system_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ministries" ADD CONSTRAINT "ministries_last_updated_by_system_users_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pod_ministries" ADD CONSTRAINT "pod_ministries_pod_id_pods_id_fk" FOREIGN KEY ("pod_id") REFERENCES "public"."pods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pod_ministries" ADD CONSTRAINT "pod_ministries_ministry_id_ministries_id_fk" FOREIGN KEY ("ministry_id") REFERENCES "public"."ministries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pod_shared_with_teams" ADD CONSTRAINT "pod_shared_with_teams_pod_id_pods_id_fk" FOREIGN KEY ("pod_id") REFERENCES "public"."pods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pod_shared_with_teams" ADD CONSTRAINT "pod_shared_with_teams_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pods" ADD CONSTRAINT "pods_created_by_system_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pods" ADD CONSTRAINT "pods_last_updated_by_system_users_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_ministry_id_ministries_id_fk" FOREIGN KEY ("ministry_id") REFERENCES "public"."ministries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_created_by_system_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_last_updated_by_system_users_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_filters" ADD CONSTRAINT "activity_filters_created_by_system_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_filters" ADD CONSTRAINT "activity_filters_last_updated_by_system_users_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
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
ALTER TABLE "date_statuses" ADD CONSTRAINT "date_statuses_created_by_system_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "date_statuses" ADD CONSTRAINT "date_statuses_last_updated_by_system_users_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_planners" ADD CONSTRAINT "event_planners_created_by_system_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_planners" ADD CONSTRAINT "event_planners_last_updated_by_system_users_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "government_representatives" ADD CONSTRAINT "government_representatives_ministry_id_ministries_id_fk" FOREIGN KEY ("ministry_id") REFERENCES "public"."ministries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "government_representatives" ADD CONSTRAINT "government_representatives_created_by_system_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "government_representatives" ADD CONSTRAINT "government_representatives_last_updated_by_system_users_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news_release_distributions" ADD CONSTRAINT "news_release_distributions_created_by_system_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news_release_distributions" ADD CONSTRAINT "news_release_distributions_last_updated_by_system_users_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news_release_origins" ADD CONSTRAINT "news_release_origins_created_by_system_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news_release_origins" ADD CONSTRAINT "news_release_origins_last_updated_by_system_users_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pitch_statuses" ADD CONSTRAINT "pitch_statuses_created_by_system_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pitch_statuses" ADD CONSTRAINT "pitch_statuses_last_updated_by_system_users_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "premier_requested" ADD CONSTRAINT "premier_requested_created_by_system_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "premier_requested" ADD CONSTRAINT "premier_requested_last_updated_by_system_users_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_created_by_system_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_last_updated_by_system_users_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sectors" ADD CONSTRAINT "sectors_created_by_system_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sectors" ADD CONSTRAINT "sectors_last_updated_by_system_users_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_created_by_system_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_last_updated_by_system_users_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "themes" ADD CONSTRAINT "themes_created_by_system_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "themes" ADD CONSTRAINT "themes_last_updated_by_system_users_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_statuses" ADD CONSTRAINT "time_statuses_created_by_system_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_statuses" ADD CONSTRAINT "time_statuses_last_updated_by_system_users_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "translated_languages" ADD CONSTRAINT "translated_languages_created_by_system_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "translated_languages" ADD CONSTRAINT "translated_languages_last_updated_by_system_users_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venue_statuses" ADD CONSTRAINT "venue_statuses_created_by_system_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venue_statuses" ADD CONSTRAINT "venue_statuses_last_updated_by_system_users_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venues" ADD CONSTRAINT "venues_created_by_system_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venues" ADD CONSTRAINT "venues_last_updated_by_system_users_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_additional_comms_contacts" ADD CONSTRAINT "activity_additional_comms_contacts_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_additional_comms_contacts" ADD CONSTRAINT "activity_additional_comms_contacts_user_id_system_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_categories" ADD CONSTRAINT "activity_categories_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_categories" ADD CONSTRAINT "activity_categories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_comms_materials" ADD CONSTRAINT "activity_comms_materials_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_comms_materials" ADD CONSTRAINT "activity_comms_materials_comms_material_id_comms_materials_id_fk" FOREIGN KEY ("comms_material_id") REFERENCES "public"."comms_materials"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_report_settings" ADD CONSTRAINT "activity_report_settings_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_report_settings" ADD CONSTRAINT "activity_report_settings_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_representatives" ADD CONSTRAINT "activity_representatives_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_sectors" ADD CONSTRAINT "activity_sectors_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_sectors" ADD CONSTRAINT "activity_sectors_sector_id_sectors_id_fk" FOREIGN KEY ("sector_id") REFERENCES "public"."sectors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_shared_with_teams" ADD CONSTRAINT "activity_shared_with_teams_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_shared_with_teams" ADD CONSTRAINT "activity_shared_with_teams_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_subscriptions" ADD CONSTRAINT "activity_subscriptions_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_subscriptions" ADD CONSTRAINT "activity_subscriptions_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_tags" ADD CONSTRAINT "activity_tags_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_tags" ADD CONSTRAINT "activity_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_themes" ADD CONSTRAINT "activity_themes_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_themes" ADD CONSTRAINT "activity_themes_theme_id_themes_id_fk" FOREIGN KEY ("theme_id") REFERENCES "public"."themes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_translation_languages" ADD CONSTRAINT "activity_translation_languages_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_translation_languages" ADD CONSTRAINT "activity_translation_languages_language_id_translated_languages_id_fk" FOREIGN KEY ("language_id") REFERENCES "public"."translated_languages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorite_activities" ADD CONSTRAINT "favorite_activities_system_user_id_system_users_id_fk" FOREIGN KEY ("system_user_id") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorite_activities" ADD CONSTRAINT "favorite_activities_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ministry_system_users" ADD CONSTRAINT "ministry_system_users_ministry_id_ministries_id_fk" FOREIGN KEY ("ministry_id") REFERENCES "public"."ministries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ministry_system_users" ADD CONSTRAINT "ministry_system_users_user_id_system_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_categories" ADD CONSTRAINT "team_categories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_categories" ADD CONSTRAINT "team_categories_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_created_by_system_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_last_updated_by_system_users_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venue_addresses" ADD CONSTRAINT "venue_addresses_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activity_history_activity_id_idx" ON "activity_history" USING btree ("activity_id");--> statement-breakpoint
CREATE INDEX "activity_history_user_id_idx" ON "activity_history" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "activity_history_timestamp_idx" ON "activity_history" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "activity_history_activity_id_timestamp_idx" ON "activity_history" USING btree ("activity_id","timestamp");--> statement-breakpoint
CREATE INDEX "idx_activity_report_settings_activity_id" ON "activity_report_settings" USING btree ("activity_id");--> statement-breakpoint
CREATE INDEX "idx_activity_report_settings_report_id" ON "activity_report_settings" USING btree ("report_id");--> statement-breakpoint
CREATE INDEX "idx_activity_report_settings_activity_report" ON "activity_report_settings" USING btree ("activity_id","report_id");--> statement-breakpoint
CREATE INDEX "idx_activity_report_settings_omitted" ON "activity_report_settings" USING btree ("omitted");