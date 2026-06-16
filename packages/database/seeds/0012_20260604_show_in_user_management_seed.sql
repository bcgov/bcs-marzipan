-- Enable show_in_user_management for permissions shown in user management UI
-- Match by permission key to avoid display_name mismatches
UPDATE permissions SET show_in_user_management = true
WHERE key IN (
  'activities.approve',
  'activities.complete',
  'activities.create',
  'activities.create.any',
  'activities.delete',
  'activities.delete.any',
  'activities.edit',
  'reports.view',
  'reports.export',
  'reports.create_custom'
);
