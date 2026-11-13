-- Grant release time edit to standard activity editing roles.
-- Idempotent: ON CONFLICT DO NOTHING on (role_id, permission_id).

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.key = 'activities.release_time.edit'
WHERE r.name IN ('Editor', 'Advanced Editor')
ON CONFLICT (role_id, permission_id) DO NOTHING;
