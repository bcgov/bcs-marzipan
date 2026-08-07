-- Additional settings-related permissions and grants (after system user + completion seed).
-- Merged: force unlock, Look Ahead reset, review-exempt field settings.
-- Idempotent: ON CONFLICT DO NOTHING / DO UPDATE where applicable.

-- ============================================================================
-- Force take activity edit lock (Admin / System Admin)
-- ============================================================================

INSERT INTO permissions (key, display_name, category, subcategory, description, resource, scope, action, sort_order) VALUES
  (
    'activities.lock.forceHandoff',
    'Force unlock',
    'Activities',
    'Edit lock',
    'Force unlock of a locked activity.',
    'activities',
    'lock',
    'forceHandoff',
    50
  )
ON CONFLICT (key) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name IN ('Admin', 'System Admin')
  AND p.key = 'activities.lock.forceHandoff'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ============================================================================
-- Look Ahead reset settings (Admin + System Admin)
-- ============================================================================

INSERT INTO permissions (key, display_name, category, subcategory, resource, action, sort_order) VALUES
  ('settings.manage.look_ahead_reset', 'Manage Look Ahead status reset', 'Settings', 'Admin', 'settings', 'manage', 63)
ON CONFLICT (key) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Admin' AND p.key = 'settings.manage.look_ahead_reset'
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'System Admin' AND p.key = 'settings.manage.look_ahead_reset'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ============================================================================
-- Review-exempt field settings: permission (System Admin only) + default application_settings row
-- ============================================================================

INSERT INTO permissions (key, display_name, category, subcategory, resource, action, sort_order) VALUES
  ('settings.manage.review_exempt_fields', 'Manage review-exempt activity fields', 'Settings', 'Admin', 'settings', 'manage', 64)
ON CONFLICT (key) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'System Admin' AND p.key = 'settings.manage.review_exempt_fields'
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO application_settings (key, value, updated_at)
VALUES (
  'activity_review_exempt_field_keys',
  '["visibility","sharedWithTeamIds"]',
  now()
)
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- Activity info icon settings: permission (System Admin only) + default application_settings row
-- ============================================================================

INSERT INTO permissions (key, display_name, category, subcategory, resource, action, sort_order) VALUES
  ('settings.manage.activity_info_icons', 'Manage activity info icon text', 'Settings', 'Admin', 'settings', 'manage', 65)
ON CONFLICT (key) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'System Admin' AND p.key = 'settings.manage.activity_info_icons'
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO application_settings (key, value, updated_at)
VALUES (
  'activity_info_icon_settings',
  '{"items":[{"fieldKey":"categoryIds","text":"**Event**: Event category\n\n**Release**: Release category\n\n**Awareness date**: Awareness category\n\n**Conference / AGM / Forum**: Conference / AGM / Forum category\n\n**FYI**: FYI category (use for internal awareness)\n\n**Social media**: Social media category\n\n**Speech**: Speech category\n\n**TV/Radio**: TV/Radio category"},{"fieldKey":"visibility","text":"On: only the lead team and Share with teams can view this activity, plus the roles below. Off: visible to everyone. GCPE executive, Strategic Communications, Cabinet Priorities, and Calendar admin roles can always view all activities."},{"fieldKey":"isConfidential","text":"Select if the activity is highly confidential or sensitive. By default, viewing is restricted to your team. For Corporate Look Ahead, enter placeholder executive-summary copy."},{"fieldKey":"isIssue","text":"Select if this activity is a current or potential media issue, or an issue for government in any way based on topic."},{"fieldKey":"significance","text":"Describe how this will impact people and why it is important."},{"fieldKey":"strategy","text":"Describe any promotion, digital content, or visuals planned as part of the announcement vision."},{"fieldKey":"schedulingNotes","text":"Use this for the date or timeframe requested, approvals received or outstanding, criteria holding up the activity, and any date or time confirmed by a third party."}]}',
  now()
)
ON CONFLICT (key) DO NOTHING;
