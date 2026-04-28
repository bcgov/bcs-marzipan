-- System user for automated jobs + activity completion permissions
-- Idempotent: uses ON CONFLICT where applicable

-- ============================================================================
-- SYSTEM USER (for automated status transitions)
-- ID 999 is reserved; must match CALENDAR_SYSTEM_USER_ID in @corpcal/shared.
-- ============================================================================

INSERT INTO users (id, ad_username, ad_display_name, ad_email, ad_department, ad_job_title, role_id, is_active)
VALUES (999, 'system', 'Calendar System', 'noreply-calendar-system@gov.bc.ca', 'System', 'Automated Service Account', 6, true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- NEW PERMISSIONS
-- activities.complete  - manually progress an activity to Completed
-- settings.manage.activity_complete - configure automated completion settings
-- ============================================================================

INSERT INTO permissions (key, display_name, category, subcategory, resource, action, sort_order) VALUES
  ('activities.complete', 'Complete activities', 'Activities', 'Admin', 'activities', 'complete', 12),
  ('settings.manage.activity_complete', 'Manage activity completion automation', 'Settings', 'Admin', 'settings', 'manage', 62)
ON CONFLICT (key) DO NOTHING;

-- Grant activities.complete to Admin role explicitly
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Admin' AND p.key = 'activities.complete'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- System Admin gets all permissions via existing CROSS JOIN in 0002 seed,
-- but run an explicit insert to be safe for incremental re-seeding.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'System Admin' AND p.key IN ('activities.complete', 'settings.manage.activity_complete')
ON CONFLICT (role_id, permission_id) DO NOTHING;
