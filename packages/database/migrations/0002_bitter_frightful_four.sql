ALTER TABLE "activities" ADD COLUMN "is_time_confirmed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "is_date_confirmed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "government_representatives" ADD COLUMN "ministry_id" uuid;--> statement-breakpoint
ALTER TABLE "government_representatives" ADD COLUMN "representative_type" varchar(50);--> statement-breakpoint
ALTER TABLE "government_representatives" ADD CONSTRAINT "government_representatives_ministry_id_ministries_id_fk" FOREIGN KEY ("ministry_id") REFERENCES "public"."ministries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" DROP COLUMN "nr_distribution_id";--> statement-breakpoint
ALTER TABLE "activities" DROP COLUMN "premier_requested_id";