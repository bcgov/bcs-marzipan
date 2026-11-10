CREATE TABLE "release_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"display_name" varchar(255) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"audience" varchar(50) NOT NULL,
	"allows_translation" boolean DEFAULT false NOT NULL,
	"requires_news_release_details" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"description" text,
	"created_date_time" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"last_updated_date_time" timestamp with time zone DEFAULT now() NOT NULL,
	"last_updated_by" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_comms_materials" (
	"comms_material_id" integer NOT NULL,
	"team_id" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "team_comms_materials_comms_material_id_team_id_pk" PRIMARY KEY("comms_material_id","team_id")
);
--> statement-breakpoint
ALTER TABLE "comms_materials" ADD COLUMN "visibility" varchar(50) DEFAULT 'global' NOT NULL;--> statement-breakpoint
ALTER TABLE "comms_materials" ADD COLUMN "release_type_id" integer;--> statement-breakpoint
ALTER TABLE "release_types" ADD CONSTRAINT "release_types_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "release_types" ADD CONSTRAINT "release_types_last_updated_by_users_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_comms_materials" ADD CONSTRAINT "team_comms_materials_comms_material_id_comms_materials_id_fk" FOREIGN KEY ("comms_material_id") REFERENCES "public"."comms_materials"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_comms_materials" ADD CONSTRAINT "team_comms_materials_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "release_types_normalized_name_unique" ON "release_types" USING btree (lower(regexp_replace("name", '^[[:space:]]+|[[:space:]]+$', '', 'g')));--> statement-breakpoint
ALTER TABLE "comms_materials" ADD CONSTRAINT "comms_materials_release_type_id_release_types_id_fk" FOREIGN KEY ("release_type_id") REFERENCES "public"."release_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "comms_materials_release_type_id_unique" ON "comms_materials" USING btree ("release_type_id") WHERE "comms_materials"."release_type_id" IS NOT NULL;