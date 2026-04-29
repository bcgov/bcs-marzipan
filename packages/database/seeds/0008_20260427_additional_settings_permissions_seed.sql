-- Additional settings-related permissions and grants (after system user + completion seed).
-- Merged: force unlock, Look Ahead reset, review-exempt field settings.
-- Idempotent: ON CONFLICT DO NOTHING / DO UPDATE where applicable.

-- ============================================================================
-- Force take activity edit lock (Admin / System Admin)
-- ============================================================================

INSERT INTO permissions (key, display_name, category, subcategory, description, resource, scope, action, sort_order) VALUES
  (
    'activities.lock.forceHandoff',
    'Force unlock',
    'Activities',
    'Edit lock',
    'Force unlock of a locked activity.',
    'activities',
    'lock',
    'forceHandoff',
    50
  )
ON CONFLICT (key) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name IN ('Admin', 'System Admin')
  AND p.key = 'activities.lock.forceHandoff'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ============================================================================
-- Look Ahead reset settings (Admin + System Admin)
-- ============================================================================

INSERT INTO permissions (key, display_name, category, subcategory, resource, action, sort_order) VALUES
  ('settings.manage.look_ahead_reset', 'Manage Look Ahead status reset', 'Settings', 'Admin', 'settings', 'manage', 63)
ON CONFLICT (key) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Admin' AND p.key = 'settings.manage.look_ahead_reset'
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'System Admin' AND p.key = 'settings.manage.look_ahead_reset'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ============================================================================
-- Review-exempt field settings: permission (System Admin only) + default application_settings row
-- ============================================================================

INSERT INTO permissions (key, display_name, category, subcategory, resource, action, sort_order) VALUES
  ('settings.manage.review_exempt_fields', 'Manage review-exempt activity fields', 'Settings', 'Admin', 'settings', 'manage', 64)
ON CONFLICT (key) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'System Admin' AND p.key = 'settings.manage.review_exempt_fields'
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO application_settings (key, value, updated_at)
VALUES (
  'activity_review_exempt_field_keys',
  '["visibility","sharedWithTeamIds"]',
  now()
)
ON CONFLICT (key) DO NOTHING;
