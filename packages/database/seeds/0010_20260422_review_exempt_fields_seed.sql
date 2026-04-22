-- Review-exempt field settings: permission (System Admin only) + default application_settings row
-- Idempotent: uses ON CONFLICT where applicable

-- ============================================================================
-- NEW PERMISSION
-- settings.manage.review_exempt_fields - configure review-exempt activity form fields
-- ============================================================================

INSERT INTO permissions (key, display_name, category, subcategory, resource, action, sort_order) VALUES
  ('settings.manage.review_exempt_fields', 'Manage review-exempt activity fields', 'Settings', 'Admin', 'settings', 'manage', 63)
ON CONFLICT (key) DO NOTHING;

-- System Admin only (not granted to Admin role)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'System Admin' AND p.key = 'settings.manage.review_exempt_fields'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Default configurable review-exempt keys (JSON array; must match DEFAULT_CONFIGURABLE_REVIEW_EXEMPT_FIELD_KEYS in @corpcal/shared)
INSERT INTO application_settings (key, value, updated_at)
VALUES (
  'activity_review_exempt_field_keys',
  '["visibility","sharedWithTeamIds"]',
  now()
)
ON CONFLICT (key) DO NOTHING;
