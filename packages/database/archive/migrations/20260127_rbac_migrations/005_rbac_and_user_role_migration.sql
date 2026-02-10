-- RBAC tables and user.role migration
-- Creates: roles, permissions, role_permissions, sessions, user_teams
-- Migrates: users.role (varchar) -> users.role_id (FK to roles)
-- Includes: scope column for permissions, audit columns (created_by, updated_by)

-- 1. Create roles table and insert 5 system roles
CREATE TABLE "roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL UNIQUE,
	"description" text,
	"is_system" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer,
	"updated_by" integer
);
--> statement-breakpoint
INSERT INTO "roles" ("name", "description", "is_system", "is_active") VALUES
  ('View Only', 'Read-only access to view data', true, true),
  ('Editor', 'Can create and edit activities and drafts', true, true),
  ('Advanced', 'Editor plus approve and export', true, true),
  ('Admin', 'Full admin access including delete, publish, users, teams', true, true),
  ('System Admin', 'Complete system access including role and permission management', true, true);
--> statement-breakpoint

-- 2. Create permissions table (includes scope column for field-level permissions)
CREATE TABLE "permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar(200) NOT NULL UNIQUE,
	"display_name" varchar(200) NOT NULL,
	"category" varchar(100) NOT NULL,
	"subcategory" varchar(100),
	"description" text,
	"resource" varchar(100),
	"action" varchar(50),
	"scope" varchar(100),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer,
	"updated_by" integer
);
--> statement-breakpoint

-- 3. Create role_permissions junction table
CREATE TABLE "role_permissions" (
	"role_id" integer NOT NULL,
	"permission_id" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer,
	"updated_by" integer,
	PRIMARY KEY("role_id","permission_id")
);
--> statement-breakpoint

-- 4. Add FK constraints for role_permissions
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint

-- 5. Create user_teams junction table (for data scoping)
CREATE TABLE "user_teams" (
	"user_id" integer NOT NULL,
	"team_id" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	PRIMARY KEY("user_id","team_id")
);
--> statement-breakpoint
ALTER TABLE "user_teams" ADD CONSTRAINT "user_teams_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "user_teams" ADD CONSTRAINT "user_teams_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint

-- 6. Create sessions table
CREATE TABLE "sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"token" varchar(500) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"last_accessed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint

-- 7. Migrate users.role (varchar) to users.role_id (FK to roles)
-- Add column (nullable first to allow backfill)
ALTER TABLE "users" ADD COLUMN "role_id" integer;
--> statement-breakpoint
-- Backfill: map legacy role strings to role ids
UPDATE "users" u
SET "role_id" = (
  SELECT r."id" FROM "roles" r
  WHERE r."name" = CASE u."role"
    WHEN 'ReadOnly' THEN 'View Only'
    WHEN 'ViewOnly' THEN 'View Only'
    WHEN 'Editor' THEN 'Editor'
    WHEN 'Advanced' THEN 'Advanced'
    WHEN 'Admin' THEN 'Admin'
    WHEN 'SystemAdmin' THEN 'System Admin'
    WHEN 'System Admin' THEN 'System Admin'
    ELSE 'View Only'
  END
  LIMIT 1
);
--> statement-breakpoint
-- Ensure any nulls get View Only (e.g. no matching legacy value)
UPDATE "users" SET "role_id" = (SELECT "id" FROM "roles" WHERE "name" = 'View Only' LIMIT 1) WHERE "role_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "role";
--> statement-breakpoint

-- 8. Add FK constraints for audit columns (created_by, updated_by)
-- These are added after users table has role_id to avoid circular dependency issues
ALTER TABLE "roles" ADD CONSTRAINT "roles_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "roles" ADD CONSTRAINT "roles_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
