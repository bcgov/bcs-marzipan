-- Per-user palette keys for dev fixtures (matches defaultUserColourKeyForUserId).
-- Inserts only when no user_settings row exists (safe to re-run).

INSERT INTO user_settings (user_id, user_colour_key, direct_login_enabled)
SELECT
  u.id,
  (ARRAY[
    'red', 'orange', 'yellow', 'lime', 'green', 'teal',
    'cyan', 'blue', 'indigo', 'purple', 'fuchsia', 'pink'
  ])[1 + (u.id % 12)],
  false
FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM user_settings us WHERE us.user_id = u.id
);