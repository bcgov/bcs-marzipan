-- Seed Script for Roles
-- This script seeds the roles table with system roles
-- MUST run before 0001_20260126_lookups_seed_data.sql as users reference roles
-- Idempotent: upserts by id so re-runs update existing rows (role_id FKs stay valid)

-- ============================================================================
-- ROLES
-- System roles for RBAC (Role-Based Access Control)
-- These roles are referenced by users via role_id and by teams via role_id
-- Order: 1=Viewer, 2=Editor, 3=Advanced Viewer, 4=Advanced Editor, 5=Admin, 6=System Admin
-- ============================================================================

INSERT INTO roles (id, name, description, is_system, is_active) VALUES
  (1, 'Viewer', 'Read-only access to view data', true, true),
  (2, 'Editor', 'Can create and edit activities and drafts', true, true),
  (3, 'Advanced Viewer', 'View any team''s activities; no create, edit, or delete', true, true),
  (4, 'Advanced Editor', 'Editor plus approve and export; create/delete scoped to own team', true, true),
  (5, 'Admin', 'Full admin access including delete, publish, users, teams', true, true),
  (6, 'System Admin', 'Complete system access including role and permission management', true, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_system = EXCLUDED.is_system,
  is_active = EXCLUDED.is_active;

-- Reset sequence to prevent conflicts when inserting new records
SELECT setval('roles_id_seq', COALESCE((SELECT MAX(id) FROM roles), 1), true);
