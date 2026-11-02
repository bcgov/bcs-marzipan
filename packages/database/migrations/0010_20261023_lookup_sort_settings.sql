CREATE TABLE "lookup_sort_settings" (
	"lookup_key" varchar(64) PRIMARY KEY NOT NULL,
	"sort_mode" varchar(32) DEFAULT 'manual' NOT NULL,
	"last_updated_date_time" timestamp with time zone DEFAULT now() NOT NULL,
	"last_updated_by" integer NOT NULL
);
--> statement-breakpoint
DROP INDEX "ministry_groups_name_lower_unique";--> statement-breakpoint
ALTER TABLE "lookup_sort_settings" ADD CONSTRAINT "lookup_sort_settings_last_updated_by_users_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ministries_normalized_name_unique" ON "ministries" USING btree (lower(regexp_replace("name", '^[[:space:]]+|[[:space:]]+$', '', 'g')));--> statement-breakpoint
CREATE UNIQUE INDEX "ministry_groups_normalized_name_unique" ON "ministry_groups" USING btree (lower(regexp_replace("name", '^[[:space:]]+|[[:space:]]+$', '', 'g')));--> statement-breakpoint
CREATE UNIQUE INDEX "categories_normalized_name_unique" ON "categories" USING btree (lower(regexp_replace("name", '^[[:space:]]+|[[:space:]]+$', '', 'g')));--> statement-breakpoint
CREATE UNIQUE INDEX "cities_normalized_name_unique" ON "cities" USING btree (lower(regexp_replace("name", '^[[:space:]]+|[[:space:]]+$', '', 'g')));--> statement-breakpoint
CREATE UNIQUE INDEX "comms_materials_normalized_name_unique" ON "comms_materials" USING btree (lower(regexp_replace("name", '^[[:space:]]+|[[:space:]]+$', '', 'g')));--> statement-breakpoint
CREATE UNIQUE INDEX "government_representatives_normalized_name_unique" ON "government_representatives" USING btree (lower(regexp_replace("name", '^[[:space:]]+|[[:space:]]+$', '', 'g')));--> statement-breakpoint
CREATE UNIQUE INDEX "tags_normalized_name_unique" ON "tags" USING btree (lower(regexp_replace("name", '^[[:space:]]+|[[:space:]]+$', '', 'g')));--> statement-breakpoint
CREATE UNIQUE INDEX "themes_normalized_name_unique" ON "themes" USING btree (lower(regexp_replace("name", '^[[:space:]]+|[[:space:]]+$', '', 'g')));--> statement-breakpoint
CREATE UNIQUE INDEX "translated_languages_normalized_name_unique" ON "translated_languages" USING btree (lower(regexp_replace("name", '^[[:space:]]+|[[:space:]]+$', '', 'g')));--> statement-breakpoint
CREATE UNIQUE INDEX "venue_presets_normalized_address_unique" ON "venue_presets" USING btree (lower(regexp_replace(coalesce("address_line1", ''), '^[[:space:]]+|[[:space:]]+$', '', 'g')),lower(regexp_replace(coalesce("address_line2", ''), '^[[:space:]]+|[[:space:]]+$', '', 'g')));