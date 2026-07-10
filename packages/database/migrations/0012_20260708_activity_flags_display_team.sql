-- Add displayTeamId column to allow cosmetic team badge selection
ALTER TABLE "activity_flags"
  ADD COLUMN "display_team_id" integer REFERENCES "teams"("id") ON DELETE SET NULL;

-- Index supports FK enforcement (ON DELETE SET NULL) without scanning activity_flags
CREATE INDEX IF NOT EXISTS "activity_flags_display_team_id_idx" ON "activity_flags" ("display_team_id");
