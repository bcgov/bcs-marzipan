-- Look Ahead reset settings permission (manual + window configuration)
-- Idempotent: ON CONFLICT DO NOTHING

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
