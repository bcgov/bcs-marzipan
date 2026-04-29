CREATE TABLE "activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"display_id" varchar(50),
	"title" varchar(255) NOT NULL,
	"lead_org_id" integer,
	"lead_org_name" varchar(255),
	"summary" text NOT NULL,
	"significance" text,
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
	"venue_status_id" integer,
	"news_release_origin_id" integer,
	"news_release_id" uuid,
	"news_release_date_time" timestamp with time zone,
	"executive_summary" text,
	"look_ahead_status" varchar(50),
	"look_ahead_section" varchar(50),
	"is_confidential" boolean DEFAULT false NOT NULL,
	"notes" text,
	"pitch_date" date,
	"pitch_required_status_id" integer,
	"translations_required_status_id" integer,
	"news_release_distribution_id" integer,
	"premier_requested_id" integer,
	"visibility" varchar(50) DEFAULT 'global' NOT NULL,
	"lead_team_id" integer NOT NULL,
	"lead_ministry_id" integer,
	"activity_status_id" integer NOT NULL,
	"reviewed_field_snapshot" jsonb,
	"reviewed_field_snapshot_version" integer DEFAULT 1 NOT NULL,
	"created_by" integer NOT NULL,
	"last_updated_by" integer NOT NULL,
	"created_date_time" timestamp with time zone DEFAULT now() NOT NULL,
	"last_updated_date_time" timestamp with time zone DEFAULT now() NOT NULL,
	"row_version" bigint DEFAULT 0 NOT NULL,
	CONSTRAINT "activities_display_id_unique" UNIQUE("display_id"),
	CONSTRAINT "lead_org_at_most_one" CHECK (NOT ("activities"."lead_org_id" IS NOT NULL AND "activities"."lead_org_name" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "activity_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"activity_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"action_type" varchar(50) NOT NULL,
	"changes" jsonb,
	"notes" text,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"activity_title" text,
	"activity_display_id" text,
	"actor_display_name" text,
	"actor_username" text,
	"category_tags_text" text
);
--> statement-breakpoint
CREATE TABLE "deletion_audit" (
	"id" serial PRIMARY KEY NOT NULL,
	"activity_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"reason" text,
	"deleted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"role_id" integer NOT NULL,
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
CREATE TABLE "ministries" (
	"id" serial PRIMARY KEY NOT NULL,
	"sort_order" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"name" varchar(255) NOT NULL,
	"display_name" varchar(255) NOT NULL,
	"abbreviation" varchar(5) NOT NULL,
	"minister_government_rep_id" integer,
	"contact_user_id" integer,
	"second_contact_user_id" integer,
	"ministry_group_id" integer,
	"created_date_time" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"last_updated_date_time" timestamp with time zone DEFAULT now() NOT NULL,
	"last_updated_by" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pod_ministries" (
	"pod_id" integer NOT NULL,
	"ministry_id" integer NOT NULL,
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
CREATE TABLE "ministry_groups" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_date_time" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"last_updated_date_time" timestamp with time zone DEFAULT now() NOT NULL,
	"last_updated_by" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"display_name" varchar(255) NOT NULL,
	"organization_type" varchar(50),
	"ministry_id" integer,
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
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
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
	"province_or_state" varchar(255),
	"country" varchar(255),
	"created_date_time" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"last_updated_date_time" timestamp with time zone DEFAULT now() NOT NULL,
	"last_updated_by" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comms_contacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"display_name" varchar(255) NOT NULL,
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
CREATE TABLE "comms_materials" (
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
	"display_name" varchar(255) NOT NULL,
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
	"display_name" varchar(255) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"title" varchar(255),
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
CREATE TABLE "news_release_origins" (
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
CREATE TABLE "pitch_required_statuses" (
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
CREATE TABLE "pitch_statuses" (
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
CREATE TABLE "premier_requested" (
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
CREATE TABLE "tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"display_name" varchar(255) NOT NULL,
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
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"display_name" varchar(255) NOT NULL,
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
	"display_name" varchar(255) NOT NULL,
	"shortcode" varchar(15),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"description" text,
	"created_date_time" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"last_updated_date_time" timestamp with time zone DEFAULT now() NOT NULL,
	"last_updated_by" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "translation_required_statuses" (
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
CREATE TABLE "activity_categories" (
	"activity_id" integer NOT NULL,
	"category_id" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "activity_categories_activity_id_category_id_pk" PRIMARY KEY("activity_id","category_id")
);
--> statement-breakpoint
CREATE TABLE "activity_comms_contacts" (
	"activity_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"is_lead" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "activity_comms_contacts_activity_id_user_id_pk" PRIMARY KEY("activity_id","user_id")
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
CREATE TABLE "activity_event_planners" (
	"id" serial PRIMARY KEY NOT NULL,
	"activity_id" integer NOT NULL,
	"event_planner_id" integer,
	"event_planner_name" varchar(255),
	"is_lead" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
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
	"theme_id" integer NOT NULL,
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
	"user_id" integer NOT NULL,
	"activity_id" integer NOT NULL,
	CONSTRAINT "favorite_activities_user_id_activity_id_pk" PRIMARY KEY("user_id","activity_id")
);
--> statement-breakpoint
CREATE TABLE "ministry_users" (
	"ministry_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ministry_users_ministry_id_user_id_pk" PRIMARY KEY("ministry_id","user_id")
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
CREATE TABLE "team_tags" (
	"tag_id" integer NOT NULL,
	"team_id" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "team_tags_tag_id_team_id_pk" PRIMARY KEY("tag_id","team_id")
);
--> statement-breakpoint
CREATE TABLE "user_teams" (
	"user_id" integer NOT NULL,
	"team_id" integer NOT NULL,
	"role" varchar(50) DEFAULT 'member' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_teams_user_id_team_id_pk" PRIMARY KEY("user_id","team_id")
);
--> statement-breakpoint
CREATE TABLE "form_drafts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"form_type" varchar(50) NOT NULL,
	"entity_id" integer,
	"draft_data" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "team_permissions" (
	"team_id" integer NOT NULL,
	"permission_id" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "team_permissions_team_id_permission_id_pk" PRIMARY KEY("team_id","permission_id")
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"display_name" varchar(255),
	"abbreviation" varchar(5) NOT NULL,
	"description" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"role_id" integer,
	"ministry_id" integer,
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
	"address_line1" varchar(255),
	"address_line2" varchar(255),
	"city" varchar(255),
	"province_or_state" varchar(255),
	"country" varchar(255),
	CONSTRAINT "venue_addresses_activity_id_unique" UNIQUE("activity_id")
);
--> statement-breakpoint
CREATE TABLE "venue_presets" (
	"id" serial PRIMARY KEY NOT NULL,
	"venue_name" varchar(255) NOT NULL,
	"address_line1" varchar(255),
	"address_line2" varchar(255),
	"city" varchar(255),
	"province_or_state" varchar(255),
	"country" varchar(255),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_pinned" boolean DEFAULT false NOT NULL,
	"pinned_sort_order" integer DEFAULT 0 NOT NULL,
	"created_date_time" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"last_updated_date_time" timestamp with time zone DEFAULT now() NOT NULL,
	"last_updated_by" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar(200) NOT NULL,
	"display_name" varchar(200) NOT NULL,
	"category" varchar(100) NOT NULL,
	"subcategory" varchar(100),
	"description" text,
	"resource" varchar(100),
	"action" varchar(50),
	"scope" varchar(100),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer,
	"updated_by" integer,
	CONSTRAINT "permissions_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"role_id" integer NOT NULL,
	"permission_id" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer,
	"updated_by" integer,
	CONSTRAINT "role_permissions_role_id_permission_id_pk" PRIMARY KEY("role_id","permission_id")
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"is_system" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer,
	"updated_by" integer,
	CONSTRAINT "roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "edit_locks" (
	"id" serial PRIMARY KEY NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"username" varchar(100) NOT NULL,
	"session_id" varchar(100),
	"acquired_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"last_renewed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_activity_at" timestamp with time zone DEFAULT now() NOT NULL,
	"idle_expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "edit_lock_pending_handoffs" (
	"id" serial PRIMARY KEY NOT NULL,
	"activity_id" integer NOT NULL,
	"from_user_id" integer NOT NULL,
	"to_user_id" integer NOT NULL,
	"grace_ends_at" timestamp with time zone NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "application_settings" (
	"key" varchar(100) PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"token" varchar(500) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"last_accessed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "banner_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"content" text NOT NULL,
	"background_color" varchar(20) DEFAULT '#E6A635' NOT NULL,
	"text_color" varchar(20) DEFAULT '#000000' NOT NULL,
	"variant" varchar(20) DEFAULT 'info' NOT NULL,
	"is_dismissible" boolean DEFAULT true NOT NULL,
	"dismiss_scope" varchar(20) DEFAULT 'persistent' NOT NULL,
	"start_date_time" timestamp with time zone,
	"end_date_time" timestamp with time zone,
	"created_date_time" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"last_updated_date_time" timestamp with time zone DEFAULT now() NOT NULL,
	"last_updated_by" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activity_saved_filters" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_user_id" integer NOT NULL,
	"name" varchar(80) NOT NULL,
	"filter_state" jsonb NOT NULL,
	"search_keyword" text DEFAULT '' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"scope_type" varchar(20) DEFAULT 'user' NOT NULL,
	"scope_team_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "asf_scope_type_check" CHECK ("activity_saved_filters"."scope_type" IN ('user', 'team', 'global')),
	CONSTRAINT "asf_scope_team_scope_check" CHECK ((
        ("activity_saved_filters"."scope_type" = 'team' AND "activity_saved_filters"."scope_team_id" IS NOT NULL)
        OR
        ("activity_saved_filters"."scope_type" IN ('user', 'global') AND "activity_saved_filters"."scope_team_id" IS NULL)
      ))
);
--> statement-breakpoint
CREATE TABLE "user_activity_saved_filter_defaults" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"saved_filter_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_lead_org_id_organizations_id_fk" FOREIGN KEY ("lead_org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_date_status_id_date_statuses_id_fk" FOREIGN KEY ("date_status_id") REFERENCES "public"."date_statuses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_time_status_id_time_statuses_id_fk" FOREIGN KEY ("time_status_id") REFERENCES "public"."time_statuses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_venue_status_id_venue_statuses_id_fk" FOREIGN KEY ("venue_status_id") REFERENCES "public"."venue_statuses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_news_release_origin_id_news_release_origins_id_fk" FOREIGN KEY ("news_release_origin_id") REFERENCES "public"."news_release_origins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_pitch_required_status_id_pitch_required_statuses_id_fk" FOREIGN KEY ("pitch_required_status_id") REFERENCES "public"."pitch_required_statuses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_translations_required_status_id_translation_required_statuses_id_fk" FOREIGN KEY ("translations_required_status_id") REFERENCES "public"."translation_required_statuses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_news_release_distribution_id_news_release_distributions_id_fk" FOREIGN KEY ("news_release_distribution_id") REFERENCES "public"."news_release_distributions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_premier_requested_id_premier_requested_id_fk" FOREIGN KEY ("premier_requested_id") REFERENCES "public"."premier_requested"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_lead_team_id_teams_id_fk" FOREIGN KEY ("lead_team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_lead_ministry_id_ministries_id_fk" FOREIGN KEY ("lead_ministry_id") REFERENCES "public"."ministries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_activity_status_id_activity_statuses_id_fk" FOREIGN KEY ("activity_status_id") REFERENCES "public"."activity_statuses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_last_updated_by_users_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_history" ADD CONSTRAINT "activity_history_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_history" ADD CONSTRAINT "activity_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deletion_audit" ADD CONSTRAINT "deletion_audit_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_history" ADD CONSTRAINT "user_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_history" ADD CONSTRAINT "user_history_changed_by_user_id_users_id_fk" FOREIGN KEY ("changed_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_history" ADD CONSTRAINT "team_history_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_history" ADD CONSTRAINT "team_history_changed_by_user_id_users_id_fk" FOREIGN KEY ("changed_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ministries" ADD CONSTRAINT "ministries_contact_user_id_users_id_fk" FOREIGN KEY ("contact_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ministries" ADD CONSTRAINT "ministries_second_contact_user_id_users_id_fk" FOREIGN KEY ("second_contact_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ministries" ADD CONSTRAINT "ministries_ministry_group_id_ministry_groups_id_fk" FOREIGN KEY ("ministry_group_id") REFERENCES "public"."ministry_groups"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ministries" ADD CONSTRAINT "ministries_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ministries" ADD CONSTRAINT "ministries_last_updated_by_users_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pod_ministries" ADD CONSTRAINT "pod_ministries_pod_id_pods_id_fk" FOREIGN KEY ("pod_id") REFERENCES "public"."pods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pod_ministries" ADD CONSTRAINT "pod_ministries_ministry_id_ministries_id_fk" FOREIGN KEY ("ministry_id") REFERENCES "public"."ministries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pod_shared_with_teams" ADD CONSTRAINT "pod_shared_with_teams_pod_id_pods_id_fk" FOREIGN KEY ("pod_id") REFERENCES "public"."pods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pod_shared_with_teams" ADD CONSTRAINT "pod_shared_with_teams_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pods" ADD CONSTRAINT "pods_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pods" ADD CONSTRAINT "pods_last_updated_by_users_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ministry_groups" ADD CONSTRAINT "ministry_groups_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ministry_groups" ADD CONSTRAINT "ministry_groups_last_updated_by_users_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_ministry_id_ministries_id_fk" FOREIGN KEY ("ministry_id") REFERENCES "public"."ministries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_last_updated_by_users_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_filters" ADD CONSTRAINT "activity_filters_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_filters" ADD CONSTRAINT "activity_filters_last_updated_by_users_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_statuses" ADD CONSTRAINT "activity_statuses_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_statuses" ADD CONSTRAINT "activity_statuses_last_updated_by_users_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_last_updated_by_users_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cities" ADD CONSTRAINT "cities_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cities" ADD CONSTRAINT "cities_last_updated_by_users_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comms_contacts" ADD CONSTRAINT "comms_contacts_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comms_contacts" ADD CONSTRAINT "comms_contacts_last_updated_by_users_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comms_materials" ADD CONSTRAINT "comms_materials_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comms_materials" ADD CONSTRAINT "comms_materials_last_updated_by_users_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "date_statuses" ADD CONSTRAINT "date_statuses_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "date_statuses" ADD CONSTRAINT "date_statuses_last_updated_by_users_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_planners" ADD CONSTRAINT "event_planners_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_planners" ADD CONSTRAINT "event_planners_last_updated_by_users_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "government_representatives" ADD CONSTRAINT "government_representatives_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "government_representatives" ADD CONSTRAINT "government_representatives_last_updated_by_users_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news_release_distributions" ADD CONSTRAINT "news_release_distributions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news_release_distributions" ADD CONSTRAINT "news_release_distributions_last_updated_by_users_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news_release_origins" ADD CONSTRAINT "news_release_origins_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news_release_origins" ADD CONSTRAINT "news_release_origins_last_updated_by_users_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pitch_required_statuses" ADD CONSTRAINT "pitch_required_statuses_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pitch_required_statuses" ADD CONSTRAINT "pitch_required_statuses_last_updated_by_users_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pitch_statuses" ADD CONSTRAINT "pitch_statuses_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pitch_statuses" ADD CONSTRAINT "pitch_statuses_last_updated_by_users_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "premier_requested" ADD CONSTRAINT "premier_requested_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "premier_requested" ADD CONSTRAINT "premier_requested_last_updated_by_users_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_last_updated_by_users_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sectors" ADD CONSTRAINT "sectors_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sectors" ADD CONSTRAINT "sectors_last_updated_by_users_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_last_updated_by_users_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "themes" ADD CONSTRAINT "themes_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "themes" ADD CONSTRAINT "themes_last_updated_by_users_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_statuses" ADD CONSTRAINT "time_statuses_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_statuses" ADD CONSTRAINT "time_statuses_last_updated_by_users_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "translated_languages" ADD CONSTRAINT "translated_languages_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "translated_languages" ADD CONSTRAINT "translated_languages_last_updated_by_users_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "translation_required_statuses" ADD CONSTRAINT "translation_required_statuses_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "translation_required_statuses" ADD CONSTRAINT "translation_required_statuses_last_updated_by_users_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venue_statuses" ADD CONSTRAINT "venue_statuses_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venue_statuses" ADD CONSTRAINT "venue_statuses_last_updated_by_users_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_categories" ADD CONSTRAINT "activity_categories_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_categories" ADD CONSTRAINT "activity_categories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_comms_contacts" ADD CONSTRAINT "activity_comms_contacts_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_comms_contacts" ADD CONSTRAINT "activity_comms_contacts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_comms_materials" ADD CONSTRAINT "activity_comms_materials_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_comms_materials" ADD CONSTRAINT "activity_comms_materials_comms_material_id_comms_materials_id_fk" FOREIGN KEY ("comms_material_id") REFERENCES "public"."comms_materials"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_event_planners" ADD CONSTRAINT "activity_event_planners_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_event_planners" ADD CONSTRAINT "activity_event_planners_event_planner_id_event_planners_id_fk" FOREIGN KEY ("event_planner_id") REFERENCES "public"."event_planners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
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
ALTER TABLE "favorite_activities" ADD CONSTRAINT "favorite_activities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorite_activities" ADD CONSTRAINT "favorite_activities_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ministry_users" ADD CONSTRAINT "ministry_users_ministry_id_ministries_id_fk" FOREIGN KEY ("ministry_id") REFERENCES "public"."ministries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ministry_users" ADD CONSTRAINT "ministry_users_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_categories" ADD CONSTRAINT "team_categories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_categories" ADD CONSTRAINT "team_categories_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_tags" ADD CONSTRAINT "team_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_tags" ADD CONSTRAINT "team_tags_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_teams" ADD CONSTRAINT "user_teams_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_teams" ADD CONSTRAINT "user_teams_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_drafts" ADD CONSTRAINT "form_drafts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_permissions" ADD CONSTRAINT "team_permissions_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_permissions" ADD CONSTRAINT "team_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_ministry_id_ministries_id_fk" FOREIGN KEY ("ministry_id") REFERENCES "public"."ministries"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_last_updated_by_users_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venue_addresses" ADD CONSTRAINT "venue_addresses_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venue_presets" ADD CONSTRAINT "venue_presets_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venue_presets" ADD CONSTRAINT "venue_presets_last_updated_by_users_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roles" ADD CONSTRAINT "roles_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roles" ADD CONSTRAINT "roles_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "edit_locks" ADD CONSTRAINT "edit_locks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "edit_lock_pending_handoffs" ADD CONSTRAINT "edit_lock_pending_handoffs_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "edit_lock_pending_handoffs" ADD CONSTRAINT "edit_lock_pending_handoffs_from_user_id_users_id_fk" FOREIGN KEY ("from_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "edit_lock_pending_handoffs" ADD CONSTRAINT "edit_lock_pending_handoffs_to_user_id_users_id_fk" FOREIGN KEY ("to_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "banner_settings" ADD CONSTRAINT "banner_settings_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "banner_settings" ADD CONSTRAINT "banner_settings_last_updated_by_users_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_saved_filters" ADD CONSTRAINT "activity_saved_filters_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_activity_saved_filter_defaults" ADD CONSTRAINT "user_activity_saved_filter_defaults_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_activity_saved_filter_defaults" ADD CONSTRAINT "user_activity_saved_filter_defaults_saved_filter_id_activity_saved_filters_id_fk" FOREIGN KEY ("saved_filter_id") REFERENCES "public"."activity_saved_filters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_activities_title_trgm" ON "activities" USING gin (lower("title") gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "idx_activities_display_id_trgm" ON "activities" USING gin (lower("display_id") gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "activity_history_activity_id_idx" ON "activity_history" USING btree ("activity_id");--> statement-breakpoint
CREATE INDEX "activity_history_user_id_idx" ON "activity_history" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "activity_history_timestamp_idx" ON "activity_history" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "activity_history_activity_id_timestamp_idx" ON "activity_history" USING btree ("activity_id","timestamp");--> statement-breakpoint
CREATE INDEX "idx_activity_history_ts_id" ON "activity_history" USING btree ("timestamp","id");--> statement-breakpoint
CREATE INDEX "idx_activity_history_notes_trgm" ON "activity_history" USING gin (lower("notes") gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "idx_users_ad_display_name_trgm" ON "users" USING gin (lower("ad_display_name") gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "idx_users_ad_username_trgm" ON "users" USING gin (lower("ad_username") gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "user_history_user_id_idx" ON "user_history" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_history_changed_by_user_id_idx" ON "user_history" USING btree ("changed_by_user_id");--> statement-breakpoint
CREATE INDEX "user_history_timestamp_idx" ON "user_history" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "user_history_user_id_timestamp_idx" ON "user_history" USING btree ("user_id","timestamp");--> statement-breakpoint
CREATE INDEX "team_history_team_id_idx" ON "team_history" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "team_history_changed_by_user_id_idx" ON "team_history" USING btree ("changed_by_user_id");--> statement-breakpoint
CREATE INDEX "team_history_timestamp_idx" ON "team_history" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "team_history_team_id_timestamp_idx" ON "team_history" USING btree ("team_id","timestamp");--> statement-breakpoint
CREATE UNIQUE INDEX "ministry_groups_name_lower_unique" ON "ministry_groups" USING btree (lower("name"));--> statement-breakpoint
CREATE INDEX "idx_categories_display_name_trgm" ON "categories" USING gin (lower("display_name") gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "idx_tags_display_name_trgm" ON "tags" USING gin (lower("display_name") gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "idx_activity_report_settings_activity_id" ON "activity_report_settings" USING btree ("activity_id");--> statement-breakpoint
CREATE INDEX "idx_activity_report_settings_report_id" ON "activity_report_settings" USING btree ("report_id");--> statement-breakpoint
CREATE INDEX "idx_activity_report_settings_activity_report" ON "activity_report_settings" USING btree ("activity_id","report_id");--> statement-breakpoint
CREATE INDEX "idx_activity_report_settings_omitted" ON "activity_report_settings" USING btree ("omitted");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_user_form_null_entity" ON "form_drafts" USING btree ("user_id","form_type") WHERE entity_id IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_user_form_entity" ON "form_drafts" USING btree ("user_id","form_type","entity_id") WHERE entity_id IS NOT NULL;--> statement-breakpoint
CREATE INDEX "form_drafts_user_id_idx" ON "form_drafts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "form_drafts_form_type_idx" ON "form_drafts" USING btree ("form_type");--> statement-breakpoint
CREATE INDEX "form_drafts_expires_at_idx" ON "form_drafts" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "edit_locks_entity_type_entity_id_unique" ON "edit_locks" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "edit_locks_expires_at_idx" ON "edit_locks" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "edit_locks_user_id_idx" ON "edit_locks" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "edit_locks_idle_expires_at_idx" ON "edit_locks" USING btree ("idle_expires_at");--> statement-breakpoint
CREATE INDEX "edit_lock_pending_handoffs_activity_id_idx" ON "edit_lock_pending_handoffs" USING btree ("activity_id");--> statement-breakpoint
CREATE INDEX "edit_lock_pending_handoffs_due_idx" ON "edit_lock_pending_handoffs" USING btree ("grace_ends_at");--> statement-breakpoint
CREATE UNIQUE INDEX "edit_lock_pending_handoffs_one_pending_per_activity" ON "edit_lock_pending_handoffs" USING btree ("activity_id") WHERE "edit_lock_pending_handoffs"."status" = 'pending';--> statement-breakpoint
CREATE INDEX "idx_sessions_user_id" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_sessions_expires_at" ON "sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "asf_owner_user_id_idx" ON "activity_saved_filters" USING btree ("owner_user_id");--> statement-breakpoint
CREATE INDEX "asf_scope_type_idx" ON "activity_saved_filters" USING btree ("scope_type");--> statement-breakpoint
CREATE INDEX "asf_scope_team_id_idx" ON "activity_saved_filters" USING btree ("scope_team_id");--> statement-breakpoint
CREATE UNIQUE INDEX "asf_unique_user_scope_name" ON "activity_saved_filters" USING btree ("owner_user_id",lower("name")) WHERE is_active = true AND scope_type = 'user';--> statement-breakpoint
CREATE UNIQUE INDEX "asf_unique_team_scope_name" ON "activity_saved_filters" USING btree ("scope_team_id",lower("name")) WHERE is_active = true AND scope_type = 'team';--> statement-breakpoint
CREATE UNIQUE INDEX "asf_unique_global_scope_name" ON "activity_saved_filters" USING btree (lower("name")) WHERE is_active = true AND scope_type = 'global';--> statement-breakpoint
CREATE UNIQUE INDEX "uasfd_user_unique" ON "user_activity_saved_filter_defaults" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "uasfd_user_id_idx" ON "user_activity_saved_filter_defaults" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "uasfd_saved_filter_id_idx" ON "user_activity_saved_filter_defaults" USING btree ("saved_filter_id");