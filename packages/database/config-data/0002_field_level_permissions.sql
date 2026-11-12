-- Field-level scoped permissions seed (role and field access enforcement).
-- Idempotent: permissions use ON CONFLICT (key) DO NOTHING; role grants use ON CONFLICT DO NOTHING on (role_id, permission_id).

-- 1. Permission catalog
INSERT INTO permissions (key, display_name, category, subcategory, description, resource, scope, action, sort_order) VALUES
  ('activities.notes.view',          'View activity notes',              'Activities', 'Field Access', 'View the Notes field on activities',                              'activities', 'notes',          'view', 100),
  ('activities.notes.edit',          'Edit activity notes',              'Activities', 'Field Access', 'Edit the Notes field on activities',                              'activities', 'notes',          'edit', 101),
  ('activities.lookAhead.view',      'View Look Ahead fields',          'Activities', 'Field Access', 'View Executive summary, Look Ahead status, and Look Ahead section on activities', 'activities', 'lookAhead', 'view', 102),
  ('activities.lookAhead.edit',      'Edit Look Ahead fields',          'Activities', 'Field Access', 'Edit Executive summary, Look Ahead status, and Look Ahead section on activities', 'activities', 'lookAhead', 'edit', 103),
  ('activities.release_time.edit',   'Edit release time',               'Activities', 'Field Access', 'Edit Release time on activities (offset from scheduled start)', 'activities', 'releaseTime', 'edit', 105)
ON CONFLICT (key) DO NOTHING;

-- 2. Admin and System Admin: scoped activities field permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r
CROSS JOIN permissions p
WHERE r.name IN ('Admin', 'System Admin')
  AND p.key LIKE 'activities.%.view' AND p.scope IS NOT NULL
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r
CROSS JOIN permissions p
WHERE r.name IN ('Admin', 'System Admin')
  AND p.key LIKE 'activities.%.edit' AND p.scope IS NOT NULL
ON CONFLICT (role_id, permission_id) DO NOTHING;
