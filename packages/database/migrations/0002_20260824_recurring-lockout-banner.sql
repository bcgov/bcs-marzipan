CREATE TABLE "recurring_lockout_banner_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"lead_content" text DEFAULT 'Updates to activities will be locked <lockStartTime> - <lockEndTime> PT. Please make updates before lockout begins.' NOT NULL,
	"active_content" text DEFAULT 'Updates to activities are locked out until <lockEndTime> PT. Contact <report_look_ahead_cover_contact_email> to make emerging or urgent updates.' NOT NULL,
	"background_color" varchar(20) DEFAULT '#E6A635' NOT NULL,
	"text_color" varchar(20) DEFAULT '#000000' NOT NULL,
	"variant" varchar(20) DEFAULT 'warning' NOT NULL,
	"start_time_of_day" varchar(5) DEFAULT '15:00' NOT NULL,
	"end_time_of_day" varchar(5) DEFAULT '23:59' NOT NULL,
	"banner_lead_minutes" integer DEFAULT 30 NOT NULL,
	"created_date_time" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"last_updated_date_time" timestamp with time zone DEFAULT now() NOT NULL,
	"last_updated_by" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "recurring_lockout_banner_settings" ADD CONSTRAINT "recurring_lockout_banner_settings_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_lockout_banner_settings" ADD CONSTRAINT "recurring_lockout_banner_settings_last_updated_by_users_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;