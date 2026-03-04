-- RBAC: Permissions catalog and role-permission mappings
-- Run after 005_rbac_and_user_role_migration (roles already exist)
-- Idempotent: uses ON CONFLICT where applicable

-- 1. Insert permissions (skip if key exists via INSERT ... ON CONFLICT)
INSERT INTO permissions (key, display_name, category, subcategory, resource, action, sort_order) VALUES
  ('activities.view', 'View activities', 'Activities', 'Basic', 'activities', 'view', 1),
  ('activities.create', 'Create activities', 'Activities', 'Basic', 'activities', 'create', 2),
  ('activities.edit', 'Edit activities', 'Activities', 'Basic', 'activities', 'edit', 3),
  ('activities.delete', 'Delete activities', 'Activities', 'Basic', 'activities', 'delete', 4),
  ('activities.approve', 'Approve activities', 'Activities', 'Basic', 'activities', 'approve', 5),
  ('activities.review', 'Review activities', 'Activities', 'Basic', 'activities', 'review', 6),
  ('activities.publish', 'Publish activities', 'Activities', 'Basic', 'activities', 'publish', 7),
  ('activities.unpublish', 'Unpublish activities', 'Activities', 'Basic', 'activities', 'unpublish', 8),
  ('activities.create.any', 'Create activities for any team', 'Activities', 'Admin', 'activities', 'create', 9),
  ('activities.delete.any', 'Delete any team''s activities', 'Activities', 'Admin', 'activities', 'delete', 10),
  ('drafts.view', 'View drafts', 'Drafts', 'Basic', 'drafts', 'view', 10),
  ('drafts.create', 'Create drafts', 'Drafts', 'Basic', 'drafts', 'create', 11),
  ('drafts.edit', 'Edit drafts', 'Drafts', 'Basic', 'drafts', 'edit', 12),
  ('drafts.delete', 'Delete drafts', 'Drafts', 'Basic', 'drafts', 'delete', 13),
  ('drafts.recover', 'Recover drafts', 'Drafts', 'Basic', 'drafts', 'recover', 14),
  ('reports.view', 'View reports', 'Reports', 'Basic', 'reports', 'view', 20),
  ('reports.export', 'Export reports', 'Reports', 'Basic', 'reports', 'export', 21),
  ('reports.create_custom', 'Create custom reports', 'Reports', 'Basic', 'reports', 'create_custom', 22),
  ('lookups.view', 'View lookups', 'Lookups', 'Basic', 'lookups', 'view', 30),
  ('lookups.manage', 'Manage lookups', 'Lookups', 'Admin', 'lookups', 'manage', 31),
  ('users.view', 'View users', 'Users', 'Basic', 'users', 'view', 40),
  ('users.create', 'Create users', 'Users', 'Basic', 'users', 'create', 41),
  ('users.edit', 'Edit users', 'Users', 'Basic', 'users', 'edit', 42),
  ('users.delete', 'Delete users', 'Users', 'Basic', 'users', 'delete', 43),
  ('users.manage_roles', 'Manage user roles', 'Users', 'Admin', 'users', 'manage_roles', 44),
  ('users.transfer_activities', 'Transfer activities between users', 'Users', 'Admin', 'users', 'transfer_activities', 45),
  ('teams.view', 'View teams', 'Teams', 'Basic', 'teams', 'view', 50),
  ('teams.create', 'Create teams', 'Teams', 'Basic', 'teams', 'create', 51),
  ('teams.edit', 'Edit teams', 'Teams', 'Basic', 'teams', 'edit', 52),
  ('teams.delete', 'Delete teams', 'Teams', 'Basic', 'teams', 'delete', 53),
  ('settings.view', 'View settings', 'Settings', 'Basic', 'settings', 'view', 60),
  ('settings.manage', 'Manage settings', 'Settings', 'Basic', 'settings', 'manage', 61),
  ('system.view_logs', 'View system logs', 'System', 'Admin', 'system', 'view_logs', 70),
  ('system.manage_permissions', 'Manage permissions', 'System', 'Admin', 'system', 'manage_permissions', 71)
ON CONFLICT (key) DO NOTHING;

-- 2. Viewer (view only, scoped)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Viewer' AND p.key IN ('activities.view','drafts.view','reports.view','lookups.view')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 3. Editor (Viewer + create, edit, delete, drafts; all scoped)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Editor' AND p.key IN (
  'activities.view','activities.create','activities.edit','activities.delete',
  'drafts.view','drafts.create','drafts.edit','drafts.delete',
  'reports.view','lookups.view'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 4. Advanced Viewer (view only, bypass scoping)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Advanced Viewer' AND p.key IN ('activities.view','drafts.view','reports.view','lookups.view')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 5. Advanced Editor (create/delete scoped; approve, export, recover)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Advanced Editor' AND p.key IN (
  'activities.view','activities.create','activities.edit','activities.delete','activities.approve',
  'drafts.view','drafts.create','drafts.edit','drafts.delete','drafts.recover',
  'reports.view','reports.export','lookups.view'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 6. Admin (create.any, delete.any, publish, users, teams, lookups.manage, settings)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Admin' AND p.key IN (
  'activities.view','activities.create','activities.edit','activities.delete','activities.create.any','activities.delete.any','activities.approve','activities.review','activities.publish','activities.unpublish',
  'drafts.view','drafts.create','drafts.edit','drafts.delete','drafts.recover',
  'reports.view','reports.export','reports.create_custom',
  'lookups.view','lookups.manage',
  'users.view','users.create','users.edit','users.transfer_activities',
  'teams.view','teams.create','teams.edit','teams.delete',
  'settings.view','settings.manage'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 7. System Admin: all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'System Admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;
