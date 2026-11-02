CREATE TABLE "codes" (
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
CREATE TABLE "activity_codes" (
	"activity_id" integer NOT NULL,
	"code_id" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "activity_codes_activity_id_code_id_pk" PRIMARY KEY("activity_id","code_id")
);
--> statement-breakpoint
DROP TABLE "pitch_statuses" CASCADE;--> statement-breakpoint
DROP TABLE "activity_report_settings" CASCADE;--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "internal_notes" text;--> statement-breakpoint
ALTER TABLE "codes" ADD CONSTRAINT "codes_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "codes" ADD CONSTRAINT "codes_last_updated_by_users_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_codes" ADD CONSTRAINT "activity_codes_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_codes" ADD CONSTRAINT "activity_codes_code_id_codes_id_fk" FOREIGN KEY ("code_id") REFERENCES "public"."codes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_codes_display_name_trgm" ON "codes" USING gin (lower("display_name") gin_trgm_ops);--> statement-breakpoint
ALTER TABLE "activities" DROP COLUMN "strategy";--> statement-breakpoint
ALTER TABLE "activities" DROP COLUMN "news_release_id";