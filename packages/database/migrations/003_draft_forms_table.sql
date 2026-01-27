CREATE TABLE "form_drafts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"form_type" varchar(50) NOT NULL,
	"entity_id" integer,
	"draft_data" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	CONSTRAINT "unique_user_form_entity" UNIQUE("user_id","form_type","entity_id")
);
--> statement-breakpoint
CREATE INDEX "form_drafts_user_id_idx" ON "form_drafts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "form_drafts_form_type_idx" ON "form_drafts" USING btree ("form_type");--> statement-breakpoint
CREATE INDEX "form_drafts_expires_at_idx" ON "form_drafts" USING btree ("expires_at");