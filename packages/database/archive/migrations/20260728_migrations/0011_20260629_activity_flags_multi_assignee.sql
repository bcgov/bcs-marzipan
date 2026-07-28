-- Allow multiple assignees per (activity, team) by keying uniqueness on assignee too.
ALTER TABLE "activity_flags"
  DROP CONSTRAINT IF EXISTS "activity_flags_activity_id_team_id_unique";

ALTER TABLE "activity_flags"
  ADD CONSTRAINT "activity_flags_activity_id_team_id_assignee_id_unique"
  UNIQUE ("activity_id", "team_id", "assignee_id");

CREATE INDEX IF NOT EXISTS "activity_flags_activity_id_team_id_idx"
  ON "activity_flags" ("activity_id", "team_id");
