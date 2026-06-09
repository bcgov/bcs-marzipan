-- Add show_in_user_management flag to permissions
ALTER TABLE permissions
  ADD COLUMN IF NOT EXISTS show_in_user_management boolean;

-- If the column existed previously (or was just added) and had NULLs, normalise them
UPDATE permissions SET show_in_user_management = false WHERE show_in_user_management IS NULL;

ALTER TABLE permissions
  ALTER COLUMN show_in_user_management SET DEFAULT false,
  ALTER COLUMN show_in_user_management SET NOT NULL;
