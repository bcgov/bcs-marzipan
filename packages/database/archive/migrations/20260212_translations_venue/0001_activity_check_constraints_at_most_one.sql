ALTER TABLE "activities" DROP CONSTRAINT "lead_org_xor";--> statement-breakpoint
ALTER TABLE "activities" DROP CONSTRAINT "event_planner_lead_xor";--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "lead_org_at_most_one" CHECK (NOT ("activities"."lead_org_id" IS NOT NULL AND "activities"."lead_org_name" IS NOT NULL));--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "event_planner_lead_at_most_one" CHECK (NOT ("activities"."event_planner_lead_id" IS NOT NULL AND "activities"."event_planner_lead_name" IS NOT NULL));