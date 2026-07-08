-- Add displayTeamId column to allow cosmetic team badge selection
ALTER TABLE "activity_flags"
  ADD COLUMN "display_team_id" integer REFERENCES "teams"("id") ON DELETE SET NULL;

-- No index needed for display_team_id as it's rarely queried directly
