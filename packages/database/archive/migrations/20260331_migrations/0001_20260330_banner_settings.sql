CREATE TABLE "banner_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"content" text NOT NULL,
	"background_color" varchar(20) DEFAULT '#E6A635' NOT NULL,
	"text_color" varchar(20) DEFAULT '#000000' NOT NULL,
    "variant" varchar(20) NOT NULL DEFAULT 'info',
    "dismiss_scope" varchar(20) NOT NULL DEFAULT 'persistent',
	"is_dismissible" boolean DEFAULT true NOT NULL,
	"start_date_time" timestamp with time zone,
	"end_date_time" timestamp with time zone,
	"created_date_time" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"last_updated_date_time" timestamp with time zone DEFAULT now() NOT NULL,
	"last_updated_by" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "banner_settings" ADD CONSTRAINT "banner_settings_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "banner_settings" ADD CONSTRAINT "banner_settings_last_updated_by_users_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "idx_banner_settings_active" ON "banner_settings" USING btree ("is_active");
--> statement-breakpoint
CREATE INDEX "idx_banner_settings_schedule" ON "banner_settings" USING btree ("start_date_time", "end_date_time");