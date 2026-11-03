CREATE TABLE "organization_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"display_name" varchar(255) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_date_time" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"last_updated_date_time" timestamp with time zone DEFAULT now() NOT NULL,
	"last_updated_by" integer NOT NULL,
	CONSTRAINT "organization_types_uuid_unique" UNIQUE("uuid")
);
--> statement-breakpoint
CREATE TABLE "activity_organizations" (
	"id" serial PRIMARY KEY NOT NULL,
	"activity_id" integer NOT NULL,
	"organization_id" integer,
	"organization_name" varchar(255),
	"is_lead" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "teams" RENAME COLUMN "ministry_id" TO "primary_organization_id";--> statement-breakpoint
ALTER TABLE "activities" DROP CONSTRAINT "lead_org_at_most_one";--> statement-breakpoint
ALTER TABLE "activities" DROP CONSTRAINT "activities_lead_org_id_organizations_id_fk";
--> statement-breakpoint
ALTER TABLE "activities" DROP CONSTRAINT "activities_lead_ministry_id_ministries_id_fk";
--> statement-breakpoint
ALTER TABLE "organizations" DROP CONSTRAINT "organizations_ministry_id_ministries_id_fk";
--> statement-breakpoint
ALTER TABLE "teams" DROP CONSTRAINT "teams_ministry_id_ministries_id_fk";
--> statement-breakpoint
DROP INDEX "ministries_normalized_name_unique";--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "uuid" uuid DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "abbreviation" varchar(8);--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "organization_type_id" integer;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "jurisdiction" varchar(50);--> statement-breakpoint

-- ============================================================================
-- DATA MIGRATION (legacy 0014 → catalog + activity junction)
-- Safe when tables are empty (no-op / skipped guards). Requires user id=1 for
-- organization_types seed rows when upgrading a DB that already ran seeds.
-- ============================================================================

INSERT INTO "organization_types" (
	"id", "uuid", "name", "display_name", "sort_order", "is_active", "created_by", "last_updated_by"
)
SELECT * FROM (VALUES
	(1, 'a1000001-0000-4000-8000-000000000001'::uuid, 'ministry', 'Ministry', 1, true, 1, 1),
	(2, 'a1000002-0000-4000-8000-000000000002'::uuid, 'agency', 'Agency', 2, true, 1, 1),
	(3, 'a1000003-0000-4000-8000-000000000003'::uuid, 'board_commission_council', 'Board / Commission / Council', 3, true, 1, 1),
	(4, 'a1000004-0000-4000-8000-000000000004'::uuid, 'crown_corporation', 'Crown Corporation', 4, true, 1, 1),
	(5, 'a1000005-0000-4000-8000-000000000005'::uuid, 'health_authority', 'Health Authority', 5, true, 1, 1),
	(6, 'a1000006-0000-4000-8000-000000000006'::uuid, 'tribunal', 'Tribunal', 6, true, 1, 1),
	(7, 'a1000007-0000-4000-8000-000000000007'::uuid, 'other', 'Other', 7, true, 1, 1)
) AS v(id, uuid, name, display_name, sort_order, is_active, created_by, last_updated_by)
WHERE EXISTS (SELECT 1 FROM "users" WHERE "id" = 1)
ON CONFLICT ("id") DO NOTHING;
--> statement-breakpoint

-- 1:1 org rows for each ministry (shared id); catalog fields move off ministries.
INSERT INTO "organizations" (
	"id",
	"name",
	"display_name",
	"abbreviation",
	"organization_type_id",
	"jurisdiction",
	"is_active",
	"sort_order",
	"created_by",
	"last_updated_by"
)
SELECT
	m."id",
	m."name",
	m."display_name",
	NULLIF(TRIM(m."abbreviation"), ''),
	CASE WHEN EXISTS (SELECT 1 FROM "organization_types" WHERE "id" = 1) THEN 1 ELSE NULL END,
	'bcgov',
	m."is_active",
	m."sort_order",
	m."created_by",
	m."last_updated_by"
FROM "ministries" m
WHERE NOT EXISTS (SELECT 1 FROM "organizations" o WHERE o."id" = m."id");
--> statement-breakpoint

UPDATE "organizations" o
SET
	"name" = m."name",
	"display_name" = m."display_name",
	"abbreviation" = COALESCE(NULLIF(TRIM(m."abbreviation"), ''), o."abbreviation"),
	"organization_type_id" = COALESCE(
		o."organization_type_id",
		CASE WHEN EXISTS (SELECT 1 FROM "organization_types" WHERE "id" = 1) THEN 1 ELSE NULL END
	),
	"jurisdiction" = COALESCE(o."jurisdiction", 'bcgov'),
	"is_active" = m."is_active",
	"sort_order" = m."sort_order"
FROM "ministries" m
WHERE o."id" = m."id";
--> statement-breakpoint

-- Legacy mirror org rows (organizations.ministry_id → ministries): copy catalog fields when id differs.
UPDATE "organizations" o
SET
	"name" = m."name",
	"display_name" = m."display_name",
	"abbreviation" = COALESCE(NULLIF(TRIM(m."abbreviation"), ''), o."abbreviation"),
	"organization_type_id" = COALESCE(
		o."organization_type_id",
		CASE WHEN EXISTS (SELECT 1 FROM "organization_types" WHERE "id" = 1) THEN 1 ELSE NULL END
	),
	"jurisdiction" = COALESCE(o."jurisdiction", 'bcgov')
FROM "ministries" m
WHERE o."ministry_id" = m."id"
	AND o."id" IS DISTINCT FROM m."id";
--> statement-breakpoint

-- Backfill activity junction from legacy lead org columns (one lead row each).
INSERT INTO "activity_organizations" (
	"activity_id",
	"organization_id",
	"organization_name",
	"is_lead",
	"is_active",
	"timestamp"
)
SELECT
	a."id",
	a."lead_org_id",
	NULL,
	true,
	true,
	NOW()
FROM "activities" a
WHERE a."lead_org_id" IS NOT NULL
	AND NOT EXISTS (
		SELECT 1
		FROM "activity_organizations" ao
		WHERE ao."activity_id" = a."id"
			AND ao."is_lead" = true
			AND ao."is_active" = true
	);
--> statement-breakpoint

INSERT INTO "activity_organizations" (
	"activity_id",
	"organization_id",
	"organization_name",
	"is_lead",
	"is_active",
	"timestamp"
)
SELECT
	a."id",
	NULL,
	NULLIF(TRIM(a."lead_org_name"), ''),
	true,
	true,
	NOW()
FROM "activities" a
WHERE (a."lead_org_id" IS NULL)
	AND a."lead_org_name" IS NOT NULL
	AND TRIM(a."lead_org_name") <> ''
	AND NOT EXISTS (
		SELECT 1
		FROM "activity_organizations" ao
		WHERE ao."activity_id" = a."id"
			AND ao."is_lead" = true
			AND ao."is_active" = true
	);
--> statement-breakpoint

UPDATE "teams" t
SET "primary_organization_id" = NULL
WHERE t."primary_organization_id" IS NOT NULL
	AND NOT EXISTS (
		SELECT 1 FROM "organizations" o WHERE o."id" = t."primary_organization_id"
	);
--> statement-breakpoint

ALTER TABLE "organization_types" ADD CONSTRAINT "organization_types_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_types" ADD CONSTRAINT "organization_types_last_updated_by_users_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_organizations" ADD CONSTRAINT "activity_organizations_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_organizations" ADD CONSTRAINT "activity_organizations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ministries" ADD CONSTRAINT "ministries_id_organizations_id_fk" FOREIGN KEY ("id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_organization_type_id_organization_types_id_fk" FOREIGN KEY ("organization_type_id") REFERENCES "public"."organization_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_primary_organization_id_organizations_id_fk" FOREIGN KEY ("primary_organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "organizations_normalized_name_unique" ON "organizations" USING btree (lower(regexp_replace("name", '^[[:space:]]+|[[:space:]]+$', '', 'g')));--> statement-breakpoint
ALTER TABLE "activities" DROP COLUMN "lead_org_id";--> statement-breakpoint
ALTER TABLE "activities" DROP COLUMN "lead_org_name";--> statement-breakpoint
ALTER TABLE "activities" DROP COLUMN "lead_ministry_id";--> statement-breakpoint
ALTER TABLE "ministries" DROP COLUMN "sort_order";--> statement-breakpoint
ALTER TABLE "ministries" DROP COLUMN "is_active";--> statement-breakpoint
ALTER TABLE "ministries" DROP COLUMN "name";--> statement-breakpoint
ALTER TABLE "ministries" DROP COLUMN "display_name";--> statement-breakpoint
ALTER TABLE "ministries" DROP COLUMN "abbreviation";--> statement-breakpoint
ALTER TABLE "organizations" DROP COLUMN "organization_type";--> statement-breakpoint
ALTER TABLE "organizations" DROP COLUMN "ministry_id";--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_uuid_unique" UNIQUE("uuid");
