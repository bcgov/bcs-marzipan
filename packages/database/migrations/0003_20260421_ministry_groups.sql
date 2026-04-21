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
ALTER TABLE "ministries" ADD COLUMN "ministry_group_id" integer;--> statement-breakpoint
ALTER TABLE "ministry_groups" ADD CONSTRAINT "ministry_groups_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ministry_groups" ADD CONSTRAINT "ministry_groups_last_updated_by_users_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ministries" ADD CONSTRAINT "ministries_ministry_group_id_ministry_groups_id_fk" FOREIGN KEY ("ministry_group_id") REFERENCES "public"."ministry_groups"("id") ON DELETE set null ON UPDATE no action;