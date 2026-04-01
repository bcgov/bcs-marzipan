CREATE TABLE "user_activity_saved_filter_defaults" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"context_key" varchar(100) NOT NULL,
	"saved_filter_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_activity_saved_filter_defaults" ADD CONSTRAINT "user_activity_saved_filter_defaults_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "user_activity_saved_filter_defaults" ADD CONSTRAINT "user_activity_saved_filter_defaults_saved_filter_id_activity_saved_filters_id_fk" FOREIGN KEY ("saved_filter_id") REFERENCES "public"."activity_saved_filters"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "uasfd_user_context_unique" ON "user_activity_saved_filter_defaults" USING btree ("user_id","context_key");
--> statement-breakpoint
CREATE INDEX "uasfd_user_id_idx" ON "user_activity_saved_filter_defaults" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX "uasfd_saved_filter_id_idx" ON "user_activity_saved_filter_defaults" USING btree ("saved_filter_id");
--> statement-breakpoint
INSERT INTO "user_activity_saved_filter_defaults" ("user_id", "context_key", "saved_filter_id", "updated_at")
SELECT DISTINCT ON ("owner_user_id", "context_key")
	"owner_user_id",
	"context_key",
	"id",
	now()
FROM "activity_saved_filters"
WHERE "is_active" = true
	AND "is_default" = true
	AND "scope_type" = 'user'
ORDER BY "owner_user_id", "context_key", "id" DESC;
--> statement-breakpoint
UPDATE "activity_saved_filters" SET "is_default" = false, "updated_at" = now() WHERE "is_default" = true;
