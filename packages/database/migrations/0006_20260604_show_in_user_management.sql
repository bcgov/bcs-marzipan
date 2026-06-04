-- Add show_in_user_management flag to permissions
ALTER TABLE permissions
  ADD COLUMN IF NOT EXISTS show_in_user_management boolean NOT NULL DEFAULT false;

-- Ensure existing rows have default false (already handled by DEFAULT)
UPDATE permissions SET show_in_user_management = false WHERE show_in_user_management IS NULL;
