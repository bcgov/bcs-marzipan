-- Add direct_login_enabled flag to user_settings
ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS direct_login_enabled boolean;

-- Normalise any NULLs (covers existing rows after ADD COLUMN)
UPDATE user_settings SET direct_login_enabled = false WHERE direct_login_enabled IS NULL;

ALTER TABLE user_settings
  ALTER COLUMN direct_login_enabled SET DEFAULT false,
  ALTER COLUMN direct_login_enabled SET NOT NULL;
