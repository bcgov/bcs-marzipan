ALTER TABLE "activity_history" ADD COLUMN "changed_field_keys" text[];--> statement-breakpoint
UPDATE activity_history ah
SET changed_field_keys = sub.keys
FROM (
  SELECT
    h.id,
    array_agg(DISTINCT mapped.field_key) AS keys
  FROM activity_history h
  CROSS JOIN LATERAL jsonb_array_elements(h.changes) AS elem
  CROSS JOIN LATERAL (
    SELECT CASE trim(both from elem->>'field')
      WHEN 'categories' THEN 'categoryIds'
      WHEN 'tags' THEN 'tagIds'
      WHEN 'sharedWith' THEN 'sharedWithTeamIds'
      ELSE trim(both from elem->>'field')
    END AS field_key
  ) mapped
  WHERE h.changes IS NOT NULL
    AND jsonb_typeof(h.changes) = 'array'
    AND mapped.field_key IS NOT NULL
    AND mapped.field_key <> ''
    AND mapped.field_key NOT IN (
      'id', 'createdDateTime', 'lastUpdatedDateTime', 'rowVersion',
      'displayId', 'createdBy', 'lastUpdatedBy',
      'reviewedFieldSnapshot', 'reviewedFieldSnapshotVersion',
      'newsReleaseDateTime', 'markAsCompleted', 'markAsReviewed',
      'activityHistoryNotes', 'themes',
      'clonedFromActivityId', 'clonedFromDisplayId',
      'clonedToActivityId', 'clonedToDisplayId'
    )
  GROUP BY h.id
) sub
WHERE ah.id = sub.id;--> statement-breakpoint
CREATE INDEX "idx_activity_history_changed_field_keys_gin" ON "activity_history" USING gin ("changed_field_keys");
