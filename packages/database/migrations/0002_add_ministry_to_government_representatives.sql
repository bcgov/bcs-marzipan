-- Migration: Add ministry_id and representative_type to government_representatives
-- This allows government representatives to be linked to ministries and categorized by type
-- Types: 'premier', 'minister', 'cabinet_member', 'mla', 'other'

--> statement-breakpoint
ALTER TABLE "government_representatives" ADD COLUMN "ministry_id" uuid;

--> statement-breakpoint
ALTER TABLE "government_representatives" ADD COLUMN "representative_type" varchar(50);

--> statement-breakpoint
ALTER TABLE "government_representatives" ADD CONSTRAINT "government_representatives_ministry_id_ministries_id_fk" FOREIGN KEY ("ministry_id") REFERENCES "ministries"("id") ON DELETE no action ON UPDATE no action;

