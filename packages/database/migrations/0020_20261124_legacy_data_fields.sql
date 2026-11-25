CREATE TABLE "legacy_activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"source_system" varchar(64) DEFAULT 'legacy' NOT NULL,
	"source_table" varchar(64) DEFAULT 'activity' NOT NULL,
	"source_record_id" varchar(128) NOT NULL,
	"external_reference" varchar(128),
	"matched_activity_id" integer,
	"title" varchar(255),
	"summary" text,
	"start_date" date,
	"end_date" date,
	"status_name" varchar(100),
	"look_ahead_status" varchar(64),
	"lead_org_name" varchar(255),
	"ministry_name" varchar(255),
	"location_name" varchar(255),
	"searchable_text" text NOT NULL,
	"raw_record" jsonb NOT NULL,
	"imported_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_reviewed_at" timestamp with time zone,
	"is_archived" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "legacy_activities" ADD CONSTRAINT "legacy_activities_matched_activity_id_activities_id_fk" FOREIGN KEY ("matched_activity_id") REFERENCES "public"."activities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "legacy_activities_source_unique" ON "legacy_activities" USING btree ("source_system","source_table","source_record_id");--> statement-breakpoint
CREATE INDEX "idx_legacy_activities_title_trgm" ON "legacy_activities" USING gin (lower("title") gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "idx_legacy_activities_searchable_text_trgm" ON "legacy_activities" USING gin (lower("searchable_text") gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "idx_legacy_activities_start_date" ON "legacy_activities" USING btree ("start_date");--> statement-breakpoint
CREATE INDEX "idx_legacy_activities_status_name" ON "legacy_activities" USING btree ("status_name");