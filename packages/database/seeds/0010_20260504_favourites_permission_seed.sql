-- Add favourites.manage permission and grant to all roles.
-- Idempotent: ON CONFLICT DO NOTHING.

INSERT INTO permissions (key, display_name, category, subcategory, resource, action, sort_order)
VALUES ('favourites.manage', 'Manage activity favourites', 'Favourites', 'Basic', 'favourites', 'manage', 80)
ON CONFLICT (key) DO NOTHING;

-- Grant to all roles
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE p.key = 'favourites.manage'
ON CONFLICT (role_id, permission_id) DO NOTHING;
