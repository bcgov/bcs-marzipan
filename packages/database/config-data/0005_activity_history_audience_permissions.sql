-- Activity history audience permissions (internal / private tiers).
-- Idempotent: permissions use ON CONFLICT (key) DO NOTHING; role grants use
-- ON CONFLICT DO NOTHING on (role_id, permission_id).

INSERT INTO permissions (key, display_name, category, subcategory, description, resource, scope, action, sort_order) VALUES
  ('activities.history.audience.internal', 'View internal activity history', 'Activities', 'History', 'View activity history saved with internal audience and save new history as internal.', 'activities', 'history.audience', 'internal', 116),
  ('activities.history.audience.private', 'Save private activity history', 'Activities', 'History', 'Save activity history visible only to you; System Admin may audit all private history.', 'activities', 'history.audience', 'private', 117)
ON CONFLICT (key) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r
CROSS JOIN permissions p
WHERE r.name IN ('Admin', 'System Admin')
  AND p.key IN (
    'activities.history.audience.internal',
    'activities.history.audience.private'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

UPDATE permissions SET show_in_user_management = true
WHERE key IN (
  'activities.history.audience.internal',
  'activities.history.audience.private'
);

UPDATE permissions SET allow_user_override = true
WHERE key IN (
  'activities.history.audience.internal',
  'activities.history.audience.private'
);
