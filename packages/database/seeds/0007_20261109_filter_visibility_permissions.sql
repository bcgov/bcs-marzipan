-- Add filter visibility permissions for role-based filter scoping
-- These permissions control which filters are visible to users based on their role

INSERT INTO permissions (
  key,
  display_name,
  category,
  subcategory,
  description,
  show_in_user_management,
  allow_user_override,
  resource,
  action,
  scope,
  sort_order
) VALUES
  -- Look Ahead filter - Admin+ only to reduce clutter
  ('activities.filter.view_look_ahead', 'View Look Ahead Filter', 'Activity Filters', 'Visibility', 
   'Allow users to filter activities by Look Ahead status. Admin+ only to reduce clutter.',
   false, false, 'activities', 'filter', 'look_ahead', 1),
  
  -- Event Planner filter - Advanced Viewer+ 
  ('activities.filter.view_event_planner', 'View Event Planner Filter', 'Activity Filters', 'Visibility',
   'Allow users to filter activities by event planner. Available to Advanced Viewer and above.',
   false, false, 'activities', 'filter', 'event_planner', 2),
  
  -- Translation filters - Advanced Viewer+
  ('activities.filter.view_translations', 'View Translation Filters', 'Activity Filters', 'Visibility',
   'Allow users to filter activities by translation status. Available to Advanced Viewer and above.',
   false, false, 'activities', 'filter', 'translations', 3)
ON CONFLICT (key) DO NOTHING;

-- Assign filter visibility permissions to roles

-- Editor (2): No filter visibility permissions (they see basic filters only: Date, Category, Status, Tags, Lead Team, Comms Contact)

-- Advanced Viewer (3): Can see Event Planner and Translations filters
INSERT INTO role_permissions (role_id, permission_id, is_active)
SELECT r.id, p.id, true
FROM roles r, permissions p
WHERE r.id = 3
  AND p.key IN (
    'activities.filter.view_event_planner',
    'activities.filter.view_translations'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Advanced Editor (4): Can see all filters including Look Ahead
INSERT INTO role_permissions (role_id, permission_id, is_active)
SELECT r.id, p.id, true
FROM roles r, permissions p
WHERE r.id = 4
  AND p.key IN (
    'activities.filter.view_look_ahead',
    'activities.filter.view_event_planner',
    'activities.filter.view_translations'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Admin (5): Can see all filters including Look Ahead
INSERT INTO role_permissions (role_id, permission_id, is_active)
SELECT r.id, p.id, true
FROM roles r, permissions p
WHERE r.id = 5
  AND p.key IN (
    'activities.filter.view_look_ahead',
    'activities.filter.view_event_planner',
    'activities.filter.view_translations'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- System Admin (6): Can see all filters including Look Ahead
INSERT INTO role_permissions (role_id, permission_id, is_active)
SELECT r.id, p.id, true
FROM roles r, permissions p
WHERE r.id = 6
  AND p.key IN (
    'activities.filter.view_look_ahead',
    'activities.filter.view_event_planner',
    'activities.filter.view_translations'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;
