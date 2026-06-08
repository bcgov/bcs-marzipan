-- Add show_in_user_management flag to permissions
ALTER TABLE permissions
  ADD COLUMN IF NOT EXISTS show_in_user_management boolean;

ALTER TABLE permissions
  ALTER COLUMN show_in_user_management SET DEFAULT false,
  ALTER COLUMN show_in_user_management SET NOT NULL;

-- If the column existed previously and had NULLs, normalise them
UPDATE permissions SET show_in_user_management = false WHERE show_in_user_management IS NULL;
