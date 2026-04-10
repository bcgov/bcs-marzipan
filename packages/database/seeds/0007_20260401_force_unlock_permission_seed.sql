-- Permission: force take activity edit lock (Admin / System Admin)
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
