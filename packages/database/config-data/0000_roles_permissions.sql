-- Seed Script for Roles + Base RBAC
-- This script seeds system roles, permission catalog, and base role-permission mappings
-- MUST run before 0001_20260313_lookups_seed_data.sql as users reference roles
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

-- RBAC: Permissions catalog and role-permission mappings
-- Run after 005_rbac_and_user_role_migration (roles already exist)
-- Idempotent: uses ON CONFLICT where applicable

-- 1. Insert permissions (single catalog insert; skip if key exists)
INSERT INTO permissions (key, display_name, category, subcategory, description, resource, scope, action, sort_order) VALUES
  ('activities.view', 'View activities', 'Activities', 'Basic', NULL, 'activities', NULL, 'view', 1),
  ('activities.create', 'Create activities', 'Activities', 'Basic', NULL, 'activities', NULL, 'create', 2),
  ('activities.edit', 'Edit activities', 'Activities', 'Basic', NULL, 'activities', NULL, 'edit', 3),
  ('activities.delete', 'Delete activities', 'Activities', 'Basic', NULL, 'activities', NULL, 'delete', 4),
  ('activities.requestDelete', 'Request delete (activity)', 'Activities', 'Basic', NULL, 'activities', NULL, 'requestDelete', 5),
  ('activities.approve', 'Approve activities', 'Activities', 'Basic', NULL, 'activities', NULL, 'approve', 6),
  ('activities.review', 'Review activities', 'Activities', 'Basic', NULL, 'activities', NULL, 'review', 7),
  ('activities.publish', 'Publish activities', 'Activities', 'Basic', NULL, 'activities', NULL, 'publish', 8),
  ('activities.unpublish', 'Unpublish activities', 'Activities', 'Basic', NULL, 'activities', NULL, 'unpublish', 9),
  ('activities.create.any', 'Create activities for any team', 'Activities', 'Admin', NULL, 'activities', NULL, 'create', 10),
  ('activities.delete.any', 'Delete any team''s activities', 'Activities', 'Admin', NULL, 'activities', NULL, 'delete', 11),
  ('activities.complete', 'Complete activities', 'Activities', 'Admin', NULL, 'activities', NULL, 'complete', 12),
  ('activities.flag', 'Flag / assign activities', 'Activities', 'Assignment', 'Assign an activity to a team member for follow-up. Visible within the team.', 'activities', NULL, 'flag', 13),
  ('activities.lock.forceHandoff', 'Force unlock', 'Activities', 'Edit lock', 'Force unlock of a locked activity.', 'activities', 'lock', 'forceHandoff', 50),
  ('drafts.view', 'View drafts', 'Drafts', 'Basic', NULL, 'drafts', NULL, 'view', 10),
  ('drafts.create', 'Create drafts', 'Drafts', 'Basic', NULL, 'drafts', NULL, 'create', 11),
  ('drafts.edit', 'Edit drafts', 'Drafts', 'Basic', NULL, 'drafts', NULL, 'edit', 12),
  ('drafts.delete', 'Delete drafts', 'Drafts', 'Basic', NULL, 'drafts', NULL, 'delete', 13),
  ('drafts.recover', 'Recover drafts', 'Drafts', 'Basic', NULL, 'drafts', NULL, 'recover', 14),
  ('savedFilters.view', 'View saved filters', 'Saved Filters', 'Basic', NULL, 'savedFilters', NULL, 'view', 15),
  ('savedFilters.create', 'Create saved filters', 'Saved Filters', 'Basic', NULL, 'savedFilters', NULL, 'create', 16),
  ('savedFilters.edit', 'Edit saved filters', 'Saved Filters', 'Basic', NULL, 'savedFilters', NULL, 'edit', 17),
  ('savedFilters.delete', 'Delete saved filters', 'Saved Filters', 'Basic', NULL, 'savedFilters', NULL, 'delete', 18),
  ('savedFilters.share.team', 'Share saved filters with a team', 'Saved Filters', 'Sharing', NULL, 'savedFilters', NULL, 'share', 19),
  ('savedFilters.share.global', 'Share saved filters globally', 'Saved Filters', 'Sharing', NULL, 'savedFilters', NULL, 'share', 20),
  ('reports.view', 'View reports', 'Reports', 'Basic', NULL, 'reports', NULL, 'view', 20),
  ('reports.export', 'Export reports', 'Reports', 'Basic', NULL, 'reports', NULL, 'export', 21),
  ('reports.create_custom', 'Create custom reports', 'Reports', 'Basic', NULL, 'reports', NULL, 'create_custom', 22),
  ('lookups.view', 'View lookups', 'Lookups', 'Basic', NULL, 'lookups', NULL, 'view', 30),
  ('lookups.manage', 'Manage lookups', 'Lookups', 'Admin', NULL, 'lookups', NULL, 'manage', 31),
  ('users.view', 'View users', 'Users', 'Basic', NULL, 'users', NULL, 'view', 40),
  ('users.create', 'Create users', 'Users', 'Basic', NULL, 'users', NULL, 'create', 41),
  ('users.edit', 'Edit users', 'Users', 'Basic', NULL, 'users', NULL, 'edit', 42),
  ('users.delete', 'Delete users', 'Users', 'Basic', NULL, 'users', NULL, 'delete', 43),
  ('users.manage_roles', 'Manage user roles', 'Users', 'Admin', NULL, 'users', NULL, 'manage_roles', 44),
  ('users.transfer_activities', 'Transfer activities between users', 'Users', 'Admin', NULL, 'users', NULL, 'transfer_activities', 45),
  ('teams.view', 'View teams', 'Teams', 'Basic', NULL, 'teams', NULL, 'view', 50),
  ('teams.create', 'Create teams', 'Teams', 'Basic', NULL, 'teams', NULL, 'create', 51),
  ('teams.edit', 'Edit teams', 'Teams', 'Basic', NULL, 'teams', NULL, 'edit', 52),
  ('teams.delete', 'Delete teams', 'Teams', 'Basic', NULL, 'teams', NULL, 'delete', 53),
  ('settings.view', 'View settings', 'Settings', 'Basic', NULL, 'settings', NULL, 'view', 60),
  ('settings.manage', 'Manage settings', 'Settings', 'Basic', NULL, 'settings', NULL, 'manage', 61),
  ('settings.manage.activity_complete', 'Manage activity completion automation', 'Settings', 'Admin', NULL, 'settings', NULL, 'manage', 62),
  ('settings.manage.look_ahead_reset', 'Manage Look Ahead status reset', 'Settings', 'Admin', NULL, 'settings', NULL, 'manage', 63),
  ('settings.manage.review_exempt_fields', 'Manage review-exempt activity fields', 'Settings', 'Admin', NULL, 'settings', NULL, 'manage', 64),
  ('settings.manage.activity_info_icons', 'Manage activity info icon text', 'Settings', 'Admin', NULL, 'settings', NULL, 'manage', 65),
  ('favourites.manage', 'Manage activity favourites', 'Favourites', 'Basic', NULL, 'favourites', NULL, 'manage', 80),
  ('system.view_logs', 'View system logs', 'System', 'Admin', NULL, 'system', NULL, 'view_logs', 70),
  ('system.manage_permissions', 'Manage permissions', 'System', 'Admin', NULL, 'system', NULL, 'manage_permissions', 71)
ON CONFLICT (key) DO NOTHING;

-- 2. Saved filters (CRUD for all roles)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r
CROSS JOIN permissions p
WHERE p.key IN ('savedFilters.view','savedFilters.create','savedFilters.edit','savedFilters.delete')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 3. Viewer (view only, scoped)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Viewer' AND p.key IN ('activities.view','drafts.view','reports.view','lookups.view')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 4. Editor (Viewer + create, edit, delete, drafts; all scoped)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Editor' AND p.key IN (
  'activities.view','activities.create','activities.edit','activities.requestDelete',
  'drafts.view','drafts.create','drafts.edit','drafts.delete',
  'reports.view','lookups.view','teams.view'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 5. Advanced Viewer (view only, bypass scoping)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Advanced Viewer' AND p.key IN ('activities.view','drafts.view','reports.view','lookups.view','teams.view')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 6. Advanced Editor (create/delete scoped; approve, export, recover)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Advanced Editor' AND p.key IN (
  'activities.view','activities.create','activities.edit','activities.requestDelete','activities.approve',
  'drafts.view','drafts.create','drafts.edit','drafts.delete','drafts.recover',
  'reports.view','reports.export','lookups.view','teams.view'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 7. Admin (create.any, delete.any, publish, users, teams, lookups.manage, settings)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Admin' AND p.key IN (
  'activities.view','activities.create','activities.edit','activities.delete','activities.requestDelete','activities.create.any','activities.delete.any','activities.approve','activities.review','activities.publish','activities.unpublish',
  'drafts.view','drafts.create','drafts.edit','drafts.delete','drafts.recover',
  'reports.view','reports.export','reports.create_custom',
  'lookups.view','lookups.manage',
  'users.view','users.create','users.edit','users.transfer_activities',
  'teams.view','teams.create','teams.edit','teams.delete',
  'settings.view','settings.manage'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 8. System Admin: all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'System Admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- System user for automated jobs + activity completion permissions
-- Idempotent: uses ON CONFLICT where applicable

-- ============================================================================
-- SYSTEM USER (for automated status transitions)
-- ID 999 is reserved; must match CALENDAR_SYSTEM_USER_ID in @corpcal/shared.
-- ============================================================================

INSERT INTO users (id, ad_username, ad_display_name, ad_email, ad_department, ad_job_title, role_id, is_active)
VALUES (999, 'system', 'Calendar System', 'noreply-calendar-system@gov.bc.ca', 'System', 'Automated Service Account', 6, true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- EXTENDED ROLE-LEVEL PERMISSIONS
-- Additional role/global permissions and settings defaults.
-- ============================================================================

-- Consolidated Admin/System Admin extra grants.
-- System Admin already receives all permissions above; explicit rows below preserve
-- expected grants when reseeding incrementally on existing datasets.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE (
  r.name = 'Admin'
  AND p.key IN ('activities.complete', 'settings.manage.look_ahead_reset')
) OR (
  r.name = 'System Admin'
  AND p.key IN (
    'activities.complete',
    'settings.manage.activity_complete',
    'settings.manage.look_ahead_reset',
    'settings.manage.review_exempt_fields',
    'settings.manage.activity_info_icons'
  )
) OR (
  r.name IN ('Admin', 'System Admin')
  AND p.key IN ('activities.lock.forceHandoff', 'activities.flag')
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO application_settings (key, value, updated_at)
VALUES (
  'activity_review_exempt_field_keys',
  '["visibility","sharedWithTeamIds"]',
  now()
),
(
  'activity_info_icon_settings',
  '{"items":[{"fieldKey":"categoryIds","text":"**Event**: Event category\n\n**Release**: Release category\n\n**Awareness date**: Awareness category\n\n**Conference / AGM / Forum**: Conference / AGM / Forum category\n\n**FYI**: FYI category (use for internal awareness)\n\n**Social media**: Social media category\n\n**Speech**: Speech category\n\n**TV/Radio**: TV/Radio category"},{"fieldKey":"visibility","text":"On: only the lead team and Share with teams can view this activity, plus the roles below. Off: visible to everyone. GCPE executive, Strategic Communications, Cabinet Priorities, and Calendar admin roles can always view all activities."},{"fieldKey":"isConfidential","text":"Select if the activity is highly confidential or sensitive. By default, viewing is restricted to your team. For Corporate Look Ahead, enter placeholder executive-summary copy."},{"fieldKey":"isIssue","text":"Select if this activity is a current or potential media issue, or an issue for government in any way based on topic."},{"fieldKey":"significance","text":"Describe how this will impact people and why it is important."},{"fieldKey":"strategy","text":"Describe any promotion, digital content, or visuals planned as part of the announcement vision."},{"fieldKey":"schedulingNotes","text":"Use this for the date or timeframe requested, approvals received or outstanding, criteria holding up the activity, and any date or time confirmed by a third party."}]}',
  now()
)
ON CONFLICT (key) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE p.key = 'favourites.manage'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Enable show_in_user_management for permissions shown in user management UI.
UPDATE permissions SET show_in_user_management = true
WHERE key IN (
  'activities.approve',
  'activities.complete',
  'activities.create',
  'activities.create.any',
  'activities.delete',
  'activities.delete.any',
  'activities.edit',
  'reports.view',
  'reports.export',
  'reports.create_custom'
);
