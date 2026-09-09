CREATE TABLE "notification_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_type" varchar(120) NOT NULL,
	"entity_type" varchar(80) NOT NULL,
	"entity_id" integer NOT NULL,
	"change_type" varchar(80) NOT NULL,
	"summary" text NOT NULL,
	"details" jsonb,
	"actor_user_id" integer NOT NULL,
	"actor_username" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_recipients" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"status" varchar(20) DEFAULT 'unread' NOT NULL,
	"read_at" timestamp with time zone,
	"dismissed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "enable_email_notification" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "notification_events" ADD CONSTRAINT "notification_events_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_recipients" ADD CONSTRAINT "notification_recipients_event_id_notification_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."notification_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_recipients" ADD CONSTRAINT "notification_recipients_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_notification_events_created_at" ON "notification_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_notification_events_entity" ON "notification_events" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_notification_recipients_event_user" ON "notification_recipients" USING btree ("event_id","user_id");--> statement-breakpoint
CREATE INDEX "idx_notification_recipients_user_status" ON "notification_recipients" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "idx_notification_recipients_user_created_at" ON "notification_recipients" USING btree ("user_id","created_at");