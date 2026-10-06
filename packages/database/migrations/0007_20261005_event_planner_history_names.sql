UPDATE "activity_history" AS history
SET "changes" = (
  SELECT jsonb_agg(
  CASE
    WHEN change_entry.value ->> 'field' = 'eventPlanners' THEN (
      SELECT jsonb_object_agg(
        property.key,
        CASE
          WHEN property.key = 'oldValue'
            AND jsonb_typeof(property.value) = 'array'
          THEN COALESCE(old_planners.value, property.value)
          WHEN property.key = 'newValue'
            AND jsonb_typeof(property.value) = 'array'
          THEN COALESCE(new_planners.value, property.value)
          ELSE property.value
        END
      )
      FROM jsonb_each(change_entry.value) AS property(key, value)
    )
    ELSE change_entry.value
  END
  ORDER BY change_entry.ordinality
  )
  FROM jsonb_array_elements(history."changes")
    WITH ORDINALITY AS change_entry(value, ordinality)
  LEFT JOIN LATERAL (
    SELECT jsonb_agg(
      CASE
        WHEN jsonb_typeof(planner.value) = 'object'
          AND jsonb_typeof(planner.value -> 'eventPlannerId') = 'number'
        THEN (planner.value - 'eventPlannerId') || jsonb_build_object(
          'eventPlannerName',
          COALESCE(
            NULLIF(planner.value ->> 'eventPlannerName', ''),
            legacy.display_name,
            'Planner #' || (planner.value ->> 'eventPlannerId')
          )
        )
        ELSE planner.value
      END
      ORDER BY planner.ordinality
    ) AS value
    FROM jsonb_array_elements(
      CASE
        WHEN jsonb_typeof(change_entry.value -> 'oldValue') = 'array'
        THEN change_entry.value -> 'oldValue'
        ELSE '[]'::jsonb
      END
    ) WITH ORDINALITY AS planner(value, ordinality)
    LEFT JOIN "event_planners" AS legacy
      ON legacy.id = CASE
        WHEN jsonb_typeof(planner.value -> 'eventPlannerId') = 'number'
        THEN (planner.value ->> 'eventPlannerId')::integer
      END
  ) AS old_planners ON true
  LEFT JOIN LATERAL (
    SELECT jsonb_agg(
      CASE
        WHEN jsonb_typeof(planner.value) = 'object'
          AND jsonb_typeof(planner.value -> 'eventPlannerId') = 'number'
        THEN (planner.value - 'eventPlannerId') || jsonb_build_object(
          'eventPlannerName',
          COALESCE(
            NULLIF(planner.value ->> 'eventPlannerName', ''),
            legacy.display_name,
            'Planner #' || (planner.value ->> 'eventPlannerId')
          )
        )
        ELSE planner.value
      END
      ORDER BY planner.ordinality
    ) AS value
    FROM jsonb_array_elements(
      CASE
        WHEN jsonb_typeof(change_entry.value -> 'newValue') = 'array'
        THEN change_entry.value -> 'newValue'
        ELSE '[]'::jsonb
      END
    ) WITH ORDINALITY AS planner(value, ordinality)
    LEFT JOIN "event_planners" AS legacy
      ON legacy.id = CASE
        WHEN jsonb_typeof(planner.value -> 'eventPlannerId') = 'number'
        THEN (planner.value ->> 'eventPlannerId')::integer
      END
  ) AS new_planners ON true
)
WHERE jsonb_typeof(history."changes") = 'array'
  AND EXISTS (
    SELECT 1
    FROM jsonb_array_elements(
      CASE
        WHEN jsonb_typeof(history."changes") = 'array'
        THEN history."changes"
        ELSE '[]'::jsonb
      END
    ) AS change_entry(value)
    WHERE change_entry.value ->> 'field' = 'eventPlanners'
  );