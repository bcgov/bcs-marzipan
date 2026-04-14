-- Field-level activity permissions (local/dev seed).
-- Idempotent: permissions use ON CONFLICT (key) DO NOTHING; team grants use ON CONFLICT DO NOTHING on (team_id, permission_id).

-- 1. Permission catalog (pitch date has edit only; no view permission — all users with activity access may read it)
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

-- 3. Mock team field grants (teams seed ids 1-8). GCPE 1-7 + PREM (8): notes / lookAhead / pitchStatus view.
INSERT INTO team_permissions (team_id, permission_id)
SELECT u.team_id, p.id
FROM (VALUES (1), (2), (3), (4), (5), (6), (7), (8)) AS u(team_id)
CROSS JOIN permissions p
WHERE p.key IN (
  'activities.notes.view',
  'activities.lookAhead.view',
  'activities.pitchStatus.view'
)
ON CONFLICT (team_id, permission_id) DO NOTHING;

-- CCHQ (2): field edits for mock testing
INSERT INTO team_permissions (team_id, permission_id)
SELECT 2, p.id
FROM permissions p
WHERE p.key IN (
  'activities.notes.edit',
  'activities.lookAhead.edit',
  'activities.translations.edit',
  'activities.pitchStatus.edit',
  'activities.pitchDate.edit'
)
ON CONFLICT (team_id, permission_id) DO NOTHING;

-- MR (1): translations edit only
INSERT INTO team_permissions (team_id, permission_id)
SELECT 1, p.id
FROM permissions p
WHERE p.key = 'activities.translations.edit'
ON CONFLICT (team_id, permission_id) DO NOTHING;
