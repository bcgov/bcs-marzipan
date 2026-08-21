-- Configurable activity list bulk-update permission.
-- Admin and System Admin receive it initially; grants can be managed through RBAC afterward.

INSERT INTO permissions (
  key,
  display_name,
  category,
  subcategory,
  description,
  resource,
  action,
  sort_order
) VALUES (
  'activities.bulkUpdate',
  'Bulk update activities',
  'Activities',
  'Workflow',
  'Mark multiple activities reviewed or update their pitch status from the activity list',
  'activities',
  'bulkUpdate',
  12
)
ON CONFLICT (key) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name IN ('Admin', 'System Admin')
  AND p.key = 'activities.bulkUpdate'
ON CONFLICT (role_id, permission_id) DO UPDATE
SET is_active = true, updated_at = now();