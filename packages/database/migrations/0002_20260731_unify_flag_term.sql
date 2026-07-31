ALTER TABLE "activity_flags" RENAME COLUMN "assignee_id" TO "flagged_user_id";--> statement-breakpoint
ALTER TABLE "activity_flags" RENAME COLUMN "assigned_by_id" TO "flagged_by_id";--> statement-breakpoint
ALTER TABLE "activity_flags" DROP CONSTRAINT "activity_flags_activity_id_team_id_assignee_id_unique";--> statement-breakpoint
ALTER TABLE "activity_flags" DROP CONSTRAINT "activity_flags_assignee_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "activity_flags" DROP CONSTRAINT "activity_flags_assigned_by_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "activity_flags" ADD CONSTRAINT "activity_flags_flagged_user_id_users_id_fk" FOREIGN KEY ("flagged_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_flags" ADD CONSTRAINT "activity_flags_flagged_by_id_users_id_fk" FOREIGN KEY ("flagged_by_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_flags" ADD CONSTRAINT "activity_flags_activity_id_team_id_flagged_user_id_unique" UNIQUE("activity_id","team_id","flagged_user_id");--> statement-breakpoint
-- Backfill activity history: flag.assigneeName -> flag.flaggedUserName (idempotent)
UPDATE "activity_history" AS ah
SET "changes" = (
  SELECT COALESCE(
    jsonb_agg(
      CASE
        WHEN elem->>'field' = 'flag.assigneeName'
        THEN jsonb_set(elem, '{field}', '"flag.flaggedUserName"'::jsonb)
        ELSE elem
      END
      ORDER BY ordinality
    ),
    '[]'::jsonb
  )
  FROM jsonb_array_elements(ah."changes") WITH ORDINALITY AS t(elem, ordinality)
)
WHERE ah."changes" IS NOT NULL
  AND jsonb_typeof(ah."changes") = 'array'
  AND EXISTS (
    SELECT 1
    FROM jsonb_array_elements(ah."changes") AS e(elem)
    WHERE e.elem->>'field' = 'flag.assigneeName'
  );