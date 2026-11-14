ALTER TABLE "release_types" ADD COLUMN "report_abbreviation" varchar(6);--> statement-breakpoint
ALTER TABLE "release_types" ADD COLUMN "report_sort_order" integer DEFAULT 0 NOT NULL;