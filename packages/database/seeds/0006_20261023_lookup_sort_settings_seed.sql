-- Default sort mode for admin-reorderable lookup types (manual = use sort_order).
INSERT INTO lookup_sort_settings (lookup_key, sort_mode, last_updated_by) VALUES
  ('categories', 'manual', 1),
  ('cities', 'manual', 1),
  ('comms-materials', 'manual', 1),
  ('activity-statuses', 'manual', 1),
  ('government-representatives', 'manual', 1),
  ('ministries', 'manual', 1),
  ('ministry-groups', 'manual', 1),
  ('tags', 'manual', 1),
  ('themes', 'manual', 1),
  ('translation-languages', 'manual', 1),
  ('venue-presets', 'manual', 1)
ON CONFLICT (lookup_key) DO NOTHING;
