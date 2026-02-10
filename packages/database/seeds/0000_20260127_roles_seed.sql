-- Seed Script for Roles
-- This script seeds the roles table with system roles
-- MUST run before 0001_20260126_lookups_seed_data.sql as users reference roles
-- Idempotent: uses ON CONFLICT to prevent duplicate inserts

-- ============================================================================
-- ROLES
-- System roles for RBAC (Role-Based Access Control)
-- These roles are referenced by users via role_id foreign key
-- Order: 1=View Only, 2=Editor, 3=Advanced, 4=Admin, 5=System Admin
-- ============================================================================

INSERT INTO roles (id, name, description, is_system, is_active) VALUES
  (1, 'View Only', 'Read-only access to view data', true, true),
  (2, 'Editor', 'Can create and edit activities and drafts', true, true),
  (3, 'Advanced', 'Editor plus approve and export', true, true),
  (4, 'Admin', 'Full admin access including delete, publish, users, teams', true, true),
  (5, 'System Admin', 'Complete system access including role and permission management', true, true)
ON CONFLICT (name) DO NOTHING;

-- Reset sequence to prevent conflicts when inserting new records
SELECT setval('roles_id_seq', COALESCE((SELECT MAX(id) FROM roles), 1), true);
