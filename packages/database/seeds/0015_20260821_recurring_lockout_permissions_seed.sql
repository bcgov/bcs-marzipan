-- Recurring edit lockout permissions: manage settings + bypass lockout window.
-- Idempotent: ON CONFLICT DO NOTHING.

-- ============================================================================
-- Manage recurring lockout settings (Admin + System Admin)
-- ============================================================================

INSERT INTO permissions (key, display_name, category, subcategory, resource, action, sort_order) VALUES
  (
    'settings.manage.recurring_lockout',
    'Manage recurring edit lockout',
    'Settings',
    'Admin',
    'settings',
    'manage',
    66
  )
ON CONFLICT (key) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name IN ('Admin', 'System Admin')
  AND p.key = 'settings.manage.recurring_lockout'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ============================================================================
-- Bypass recurring edit lockout window (Admin + System Admin)
-- ============================================================================

INSERT INTO permissions (key, display_name, category, subcategory, description, resource, scope, action, sort_order) VALUES
  (
    'activities.bypass_recurring_lockout',
    'Bypass recurring edit lockout',
    'Activities',
    'Edit lock',
    'Edit activities during the recurring daily lockout window.',
    'activities',
    'lockout',
    'bypass',
    67
  )
ON CONFLICT (key) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name IN ('Admin', 'System Admin')
  AND p.key = 'activities.bypass_recurring_lockout'
ON CONFLICT (role_id, permission_id) DO NOTHING;
