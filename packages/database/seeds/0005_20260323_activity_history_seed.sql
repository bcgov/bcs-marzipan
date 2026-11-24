-- ============================================================================
-- ACTIVITY HISTORY (dev fixture aligned with cabinet seed activities)
-- ============================================================================

INSERT INTO activity_history (
  activity_id,
  user_id,
  action_type,
  changes,
  notes,
  timestamp
)
SELECT
  v.activity_id,
  v.user_id,
  v.action_type,
  v.changes,
  v.notes,
  v.timestamp
FROM (
  VALUES
    (
      5,
      4,
      'created',
      '[{"field":"activityStatusId","oldValue":null,"newValue":1},{"field":"title","oldValue":null,"newValue":"Minister Bruce Banman highlighted digital service improvements for Service BC in Victoria."}]'::jsonb,
      'Initial entry created from regional planning intake.',
      TIMESTAMPTZ '2026-01-24 09:12:00-08'
    ),
    (
      5,
      13,
      'updated',
      '[{"field":"summary","oldValue":"OPEN HOUSE: Minister Bruce Banman highlighted digital service improvements for Service BC in Victoria.","newValue":"OPEN HOUSE: Minister Bruce Banman highlighted digital service improvements for Service BC in Victoria. Expanded online verification pilot noted."}]'::jsonb,
      'Expanded summary after CITZ review.',
      TIMESTAMPTZ '2026-01-28 13:45:00-08'
    ),
    (
      5,
      18,
      'reviewed',
      '[{"field":"activityStatusId","oldValue":3,"newValue":2}]'::jsonb,
      'Reviewed for morning briefing package.',
      TIMESTAMPTZ '2026-02-02 08:20:00-08'
    ),
    (
      11,
      6,
      'created',
      '[{"field":"activityStatusId","oldValue":null,"newValue":1},{"field":"title","oldValue":null,"newValue":"Minister Kiel Giddens discussed wildfire readiness and fibre supply in Williams Lake."}]'::jsonb,
      'Created from forests forward calendar list.',
      TIMESTAMPTZ '2026-01-27 10:05:00-08'
    ),
    (
      11,
      14,
      'updated',
      '[{"field":"startDate","oldValue":"2028-01-20","newValue":"2028-01-22"},{"field":"startTime","oldValue":"11:00:00","newValue":"10:30:00"}]'::jsonb,
      'Timing adjusted to align with local availability.',
      TIMESTAMPTZ '2026-02-01 15:10:00-08'
    ),
    (
      16,
      8,
      'created',
      '[{"field":"activityStatusId","oldValue":null,"newValue":1},{"field":"isIssue","oldValue":null,"newValue":true}]'::jsonb,
      'Added from PSSG regional submissions.',
      TIMESTAMPTZ '2026-02-10 09:50:00-08'
    ),
    (
      16,
      18,
      'reviewed',
      '[{"field":"activityStatusId","oldValue":1,"newValue":2}]'::jsonb,
      'Reviewed for publication planning.',
      TIMESTAMPTZ '2026-03-05 15:35:00-08'
    ),
    (
      9,
      7,
      'updated',
      '[{"field":"isConfidential","oldValue":false,"newValue":true},{"field":"notes","oldValue":null,"newValue":"Hold details until stakeholder outreach is complete."}]'::jsonb,
      'Confidential flag added pending partner confirmation.',
      TIMESTAMPTZ '2026-03-12 11:05:00-07'
    ),
    (
      9,
      19,
      'changes_cancelled',
      '[{"field":"isConfidential","oldValue":true,"newValue":false}]'::jsonb,
      'Reverted draft-only edits after review discussion.',
      TIMESTAMPTZ '2026-03-15 16:10:00-07'
    )
) AS v(activity_id, user_id, action_type, changes, notes, timestamp)
WHERE NOT EXISTS (
  SELECT 1
  FROM activity_history ah
  WHERE ah.activity_id = v.activity_id
    AND ah.user_id = v.user_id
    AND ah.action_type = v.action_type
    AND ah.timestamp = v.timestamp
);