-- Enforce pitch-required status edit access for Advanced Editor+ roles only.
-- Idempotent and safe to re-run.

-- Remove legacy team-scoped edit grants that could allow non-elevated edits.
DELETE FROM team_permissions tp
USING permissions p
WHERE tp.permission_id = p.id
  AND p.key = 'activities.pitchStatus.edit';

-- Grant pitch status edit to Advanced Editor, Admin, and System Admin roles.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name IN ('Advanced Editor', 'Admin', 'System Admin')
  AND p.key = 'activities.pitchStatus.edit'
ON CONFLICT (role_id, permission_id) DO NOTHING;
