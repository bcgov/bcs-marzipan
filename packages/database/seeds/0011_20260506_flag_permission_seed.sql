-- Seed: activities.flag permission
-- Grant to Admin role (CCHQ) and System Admin.
-- Individual teams get this via team_permissions (managed in the UI/admin).
-- Idempotent: ON CONFLICT DO NOTHING.

INSERT INTO permissions (key, display_name, category, subcategory, description, resource, scope, action, sort_order) VALUES
  (
    'activities.flag',
    'Flag / assign activities',
    'Activities',
    'Assignment',
    'Assign an activity to a team member for follow-up. Visible within the team.',
    'activities',
    NULL,
    'flag',
    13
  )
ON CONFLICT (key) DO NOTHING;

-- Grant to Admin and System Admin roles by default.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name IN ('Admin', 'System Admin')
  AND p.key = 'activities.flag'
ON CONFLICT (role_id, permission_id) DO NOTHING;
