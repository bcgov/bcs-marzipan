CREATE TABLE IF NOT EXISTS "team_tags" (
  "tag_id" integer NOT NULL REFERENCES "tags"("id"),
  "team_id" integer NOT NULL REFERENCES "teams"("id"),
  "is_active" boolean NOT NULL DEFAULT true,
  "timestamp" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("tag_id", "team_id")
);
