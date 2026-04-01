-- Field-level activity permissions
-- Inserts 8 rows: view+edit for notes, lookAhead, pitch; edit-only for dateTimeStatus and translations.
-- Idempotent: uses ON CONFLICT (key) DO NOTHING.

INSERT INTO permissions (key, display_name, category, subcategory, description, resource, scope, action, sort_order) VALUES
  ('activities.notes.view',          'View activity notes',              'Activities', 'Field Access', 'View the Notes field on activities',                              'activities', 'notes',          'view', 100),
  ('activities.notes.edit',          'Edit activity notes',              'Activities', 'Field Access', 'Edit the Notes field on activities',                              'activities', 'notes',          'edit', 101),
  ('activities.dateTimeStatus.edit', 'Edit date/time status',           'Activities', 'Field Access', 'Edit Date Status and Time Status fields on activities',           'activities', 'dateTimeStatus', 'edit', 102),
  ('activities.lookAhead.view',      'View Look Ahead fields',          'Activities', 'Field Access', 'View Look Ahead Status and Look Ahead Section on activities',    'activities', 'lookAhead',      'view', 103),
  ('activities.lookAhead.edit',      'Edit Look Ahead fields',          'Activities', 'Field Access', 'Edit Look Ahead Status and Look Ahead Section on activities',    'activities', 'lookAhead',      'edit', 104),
  ('activities.translations.edit',   'Edit translation fields',         'Activities', 'Field Access', 'Edit Translations Required and Translation Languages on activities', 'activities', 'translations', 'edit', 105),
  ('activities.pitch.view',          'View pitch fields',               'Activities', 'Field Access', 'View Pitch Status and Pitch Date fields on activities',          'activities', 'pitch',          'view', 106),
  ('activities.pitch.edit',          'Edit pitch fields',               'Activities', 'Field Access', 'Edit Pitch Status and Pitch Date fields on activities',          'activities', 'pitch',          'edit', 107)
ON CONFLICT (key) DO NOTHING;

-- Admin and System Admin get all field-level permissions via their roles.
-- Other teams receive these via team_permissions (configured per-team, out of scope for this seed).
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
