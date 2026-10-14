-- Field-level scoped permissions seed (role and field access enforcement).
-- Idempotent: permissions use ON CONFLICT (key) DO NOTHING; role grants use ON CONFLICT DO NOTHING on (role_id, permission_id).

-- 1. Permission catalog (pitch date has edit only; no view permission - all users with activity access may read it)
INSERT INTO permissions (key, display_name, category, subcategory, description, resource, scope, action, sort_order) VALUES
  ('activities.notes.view',          'View activity notes',              'Activities', 'Field Access', 'View the Notes field on activities',                              'activities', 'notes',          'view', 100),
  ('activities.notes.edit',          'Edit activity notes',              'Activities', 'Field Access', 'Edit the Notes field on activities',                              'activities', 'notes',          'edit', 101),
  ('activities.lookAhead.view',      'View Look Ahead fields',          'Activities', 'Field Access', 'View Look Ahead Status and Look Ahead Section on activities',    'activities', 'lookAhead',      'view', 102),
  ('activities.lookAhead.edit',      'Edit Look Ahead fields',          'Activities', 'Field Access', 'Edit Look Ahead Status and Look Ahead Section on activities',    'activities', 'lookAhead',      'edit', 103),
  ('activities.translations.edit',   'Edit translation fields',         'Activities', 'Field Access', 'Edit Translations Required and Translation Languages on activities', 'activities', 'translations', 'edit', 104),
  ('activities.pitchStatus.view',    'View pitch status',               'Activities', 'Field Access', 'View Pitch required status on activities',                        'activities', 'pitchStatus',    'view', 105),
  ('activities.pitchStatus.edit',    'Edit pitch status',               'Activities', 'Field Access', 'Edit Pitch required status on activities',                        'activities', 'pitchStatus',    'edit', 106),
  ('activities.pitchDate.edit',      'Edit pitch date',                 'Activities', 'Field Access', 'Edit Pitch date on activities',                                   'activities', 'pitchDate',      'edit', 107)
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

-- Grant pitch status edit to Advanced Editor, Admin, and System Admin roles.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name IN ('Advanced Editor', 'Admin', 'System Admin')
  AND p.key = 'activities.pitchStatus.edit'
ON CONFLICT (role_id, permission_id) DO UPDATE SET is_active = true, updated_at = now();
