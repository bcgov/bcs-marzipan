-- Per-operation activity list bulk permissions + editor grants.
-- Idempotent where noted.

INSERT INTO permissions (key, display_name, category, subcategory, description, resource, scope, action, sort_order) VALUES
  ('activities.bulk.issue', 'Batch mark issues', 'Activities', 'Workflow', 'Mark multiple activities as issues from the activity list.', 'activities', 'bulk', 'issue', 13),
  ('activities.bulk.tags', 'Batch replace tags', 'Activities', 'Workflow', 'Replace tags on multiple activities from the activity list.', 'activities', 'bulk', 'tags', 14),
  ('activities.bulk.share', 'Batch add shared-with teams', 'Activities', 'Workflow', 'Add teams to Shared with from the activity list. Requires edit access on each activity.', 'activities', 'bulk', 'share', 15)
ON CONFLICT (key) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.key IN ('activities.bulk.share', 'activities.unshare')
WHERE r.name IN ('Editor', 'Advanced Editor')
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.key IN (
  'activities.bulk.issue',
  'activities.bulk.tags',
  'activities.bulk.share'
)
WHERE r.name IN ('Admin', 'System Admin')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Editors should not keep the legacy activities.bulkUpdate grant after bulk.* migration.
DELETE FROM role_permissions rp
USING roles r, permissions p
WHERE rp.role_id = r.id
  AND rp.permission_id = p.id
  AND r.name IN ('Editor', 'Advanced Editor')
  AND p.key = 'activities.bulkUpdate';

UPDATE permissions SET show_in_user_management = true
WHERE key IN (
  'activities.bulk.issue',
  'activities.bulk.tags',
  'activities.bulk.share',
  'favourites.manage'
);