-- Add variant and dismiss_scope to banner settings
ALTER TABLE "banner_settings" ADD COLUMN "variant" varchar(20) NOT NULL DEFAULT 'info';
--> statement-breakpoint
ALTER TABLE "banner_settings" ADD COLUMN "dismiss_scope" varchar(20) NOT NULL DEFAULT 'persistent';
