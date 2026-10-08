-- Adds activities.unshare / activities.unshare.all permissions and grants.
-- 0000_roles_permissions.sql has already run on deployed environments, so these
-- rows must be seeded here to reach databases that already applied it.
-- Idempotent: permissions use ON CONFLICT (key) DO NOTHING; role grants use
-- ON CONFLICT DO NOTHING on (role_id, permission_id).

INSERT INTO permissions (key, display_name, category, subcategory, description, resource, scope, action, sort_order) VALUES
  ('activities.unshare', 'Unshare activities', 'Activities', 'Sharing', 'Remove your own team from an activity''s Shared With list.', 'activities', NULL, 'unshare', 14),
  ('activities.unshare.all', 'Unshare activities for any team', 'Activities', 'Sharing', 'Remove any team from an activity''s Shared With list, not just your own.', 'activities', NULL, 'unshare', 15)
ON CONFLICT (key) DO NOTHING;

-- Admin and System Admin: grant both keys explicitly (System Admin's "all permissions"
-- wildcard in 0000 already ran on existing databases, so it won't pick these up on its own).
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r
CROSS JOIN permissions p
WHERE r.name IN ('Admin', 'System Admin')
  AND p.key IN ('activities.unshare', 'activities.unshare.all')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Show activities.unshare in the user management permissions UI.
UPDATE permissions SET show_in_user_management = true
WHERE key = 'activities.unshare';

-- Allow per-user grant/deny overrides for activities.unshare.
UPDATE permissions SET allow_user_override = true
WHERE key = 'activities.unshare';

-- Permissions that must never be overridable per user, even if mis-seeded elsewhere.
UPDATE permissions SET allow_user_override = false
WHERE key LIKE 'system.%';
