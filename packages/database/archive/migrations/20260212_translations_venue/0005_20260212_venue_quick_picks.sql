CREATE TABLE IF NOT EXISTS "venue_quick_picks" (
	"id" serial PRIMARY KEY NOT NULL,
	"venue_name" varchar(255) NOT NULL,
	"street" varchar(255),
	"city" varchar(255),
	"province_or_state" varchar(255),
	"country" varchar(255),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_date_time" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"last_updated_date_time" timestamp with time zone DEFAULT now() NOT NULL,
	"last_updated_by" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "venue_quick_picks" ADD CONSTRAINT "venue_quick_picks_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "venue_quick_picks" ADD CONSTRAINT "venue_quick_picks_last_updated_by_users_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
