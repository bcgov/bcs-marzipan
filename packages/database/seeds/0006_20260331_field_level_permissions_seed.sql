-- Field-level activity permissions (local/dev seed).
-- Idempotent: permissions use ON CONFLICT (key) DO NOTHING; team grants use ON CONFLICT DO NOTHING on (team_id, permission_id).
--
-- Also handles legacy DBs that still have activities.pitch.view / activities.pitch.edit: migrates team grants to
-- pitchStatus + pitchDate.edit, then drops obsolete rows (including activities.pitchDate.view if present).

-- 1. Permission catalog (pitch date has edit only; no view permission — all users with activity access may read it)
INSERT INTO permissions (key, display_name, category, subcategory, description, resource, scope, action, sort_order) VALUES
  ('activities.notes.view',          'View activity notes',              'Activities', 'Field Access', 'View the Notes field on activities',                              'activities', 'notes',          'view', 100),
  ('activities.notes.edit',          'Edit activity notes',              'Activities', 'Field Access', 'Edit the Notes field on activities',                              'activities', 'notes',          'edit', 101),
  ('activities.dateTimeStatus.edit', 'Edit date/time status',           'Activities', 'Field Access', 'Edit Date Status and Time Status fields on activities',           'activities', 'dateTimeStatus', 'edit', 102),
  ('activities.lookAhead.view',      'View Look Ahead fields',          'Activities', 'Field Access', 'View Look Ahead Status and Look Ahead Section on activities',    'activities', 'lookAhead',      'view', 103),
  ('activities.lookAhead.edit',      'Edit Look Ahead fields',          'Activities', 'Field Access', 'Edit Look Ahead Status and Look Ahead Section on activities',    'activities', 'lookAhead',      'edit', 104),
  ('activities.translations.edit',   'Edit translation fields',         'Activities', 'Field Access', 'Edit Translations Required and Translation Languages on activities', 'activities', 'translations', 'edit', 105),
  ('activities.pitchStatus.view',    'View pitch status',               'Activities', 'Field Access', 'View Pitch required status on activities',                        'activities', 'pitchStatus',    'view', 106),
  ('activities.pitchStatus.edit',    'Edit pitch status',               'Activities', 'Field Access', 'Edit Pitch required status on activities',                        'activities', 'pitchStatus',    'edit', 107),
  ('activities.pitchDate.edit',      'Edit pitch date',                 'Activities', 'Field Access', 'Edit Pitch date on activities',                                   'activities', 'pitchDate',      'edit', 108)
ON CONFLICT (key) DO NOTHING;

-- 2. Legacy: teams that had activities.pitch.view → activities.pitchStatus.view
INSERT INTO team_permissions (team_id, permission_id)
SELECT tp.team_id, p.id
FROM team_permissions tp
INNER JOIN permissions old_p ON old_p.id = tp.permission_id AND old_p.key = 'activities.pitch.view'
CROSS JOIN permissions p
WHERE p.key = 'activities.pitchStatus.view'
ON CONFLICT (team_id, permission_id) DO NOTHING;

-- 3. Legacy: teams that had activities.pitch.edit → pitchStatus.edit + pitchDate.edit
INSERT INTO team_permissions (team_id, permission_id)
SELECT tp.team_id, p.id
FROM team_permissions tp
INNER JOIN permissions old_p ON old_p.id = tp.permission_id AND old_p.key = 'activities.pitch.edit'
CROSS JOIN permissions p
WHERE p.key IN ('activities.pitchStatus.edit', 'activities.pitchDate.edit')
ON CONFLICT (team_id, permission_id) DO NOTHING;

-- 4. Remove obsolete keys (CASCADE clears junction rows). Safe when rows do not exist.
DELETE FROM permissions WHERE key IN (
  'activities.pitch.view',
  'activities.pitch.edit',
  'activities.pitchDate.view'
);

-- 5. Admin and System Admin: scoped activities field permissions
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

-- 6. Mock team field grants (teams seed ids 1-8). GCPE 1-7 + PREM (8): notes / lookAhead / pitchStatus view.
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
  'activities.dateTimeStatus.edit',
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
