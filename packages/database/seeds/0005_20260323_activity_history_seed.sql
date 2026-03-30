-- ============================================================================
-- ACTIVITY HISTORY
-- Seed 20 history entries spanning late January 2026 through March 23, 2026.
-- Uses a mix of editor, advanced, admin, and sysadmin users from users seed.
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
      4,
      4,
      'created',
      '[{"field":"activityStatusId","oldValue":null,"newValue":1},{"field":"title","oldValue":null,"newValue":"Minister Diana Gibson announced a digital service refresh for Service BC locations in Skeena (Terrace, Kitimat)..."}]'::jsonb,
      'Initial entry created from regional planning intake.',
      TIMESTAMPTZ '2026-01-24 09:12:00-08'
    ),
    (
      4,
      13,
      'updated',
      '[{"field":"summary","oldValue":"STAKEHOLDER CALL: Minister Diana Gibson announced a digital service refresh for Service BC locations in Skeena (Terrace, Kitimat), expanding identity verification, permitting portals and connectivity with the BCDevExchange community.","newValue":"STAKEHOLDER CALL: Minister Diana Gibson announced a digital service refresh for Service BC locations in Skeena (Terrace, Kitimat), expanding identity verification, permitting portals and connectivity with the BCDevExchange community. The work advances secure-by-design standards and plain-language service improvements across channels."}]'::jsonb,
      'Expanded summary after CITZ review.',
      TIMESTAMPTZ '2026-01-28 13:45:00-08'
    ),
    (
      4,
      18,
      'reviewed',
      '[{"field":"activityStatusId","oldValue":3,"newValue":2}]'::jsonb,
      'Reviewed for morning briefing package.',
      TIMESTAMPTZ '2026-02-02 08:20:00-08'
    ),
    (
      12,
      6,
      'created',
      '[{"field":"activityStatusId","oldValue":null,"newValue":1},{"field":"leadMinistryId","oldValue":null,"newValue":13}]'::jsonb,
      'Created from housing forward calendar list.',
      TIMESTAMPTZ '2026-01-27 10:05:00-08'
    ),
    (
      12,
      14,
      'updated',
      '[{"field":"startDate","oldValue":"2027-05-10","newValue":"2027-05-12"},{"field":"startTime","oldValue":"14:00:00","newValue":"13:30:00"}]'::jsonb,
      'Timing adjusted to align with local government availability.',
      TIMESTAMPTZ '2026-02-01 15:10:00-08'
    ),
    (
      12,
      2,
      'note_added',
      NULL,
      'Waiting on venue confirmation from the regional office before lock.',
      TIMESTAMPTZ '2026-02-06 11:30:00-08'
    ),
    (
      12,
      19,
      'reviewed',
      '[{"field":"activityStatusId","oldValue":3,"newValue":2}]'::jsonb,
      'Approved after final housing team review.',
      TIMESTAMPTZ '2026-02-08 16:25:00-08'
    ),
    (
      18,
      8,
      'created',
      '[{"field":"activityStatusId","oldValue":null,"newValue":1},{"field":"isIssue","oldValue":null,"newValue":false}]'::jsonb,
      'Added from PSFS regional submissions.',
      TIMESTAMPTZ '2026-02-10 09:50:00-08'
    ),
    (
      18,
      16,
      'updated',
      '[{"field":"venueAddress","oldValue":{"venueName":"Cranbrook Conference Centre","city":"Cranbrook"},"newValue":{"venueName":"Fernie Community Hall","city":"Fernie"}}]'::jsonb,
      'Venue updated after local host change.',
      TIMESTAMPTZ '2026-02-14 14:40:00-08'
    ),
    (
      18,
      5,
      'delete_requested',
      '[{"field":"activityStatusId","oldValue":2,"newValue":5}]'::jsonb,
      'Requested delete after duplicate appeared in another planning stream.',
      TIMESTAMPTZ '2026-02-18 10:15:00-08'
    ),
    (
      18,
      18,
      'restored',
      '[{"field":"activityStatusId","oldValue":5,"newValue":2}]'::jsonb,
      'Restored after confirming this is the canonical entry.',
      TIMESTAMPTZ '2026-02-19 09:05:00-08'
    ),
    (
      24,
      3,
      'created',
      '[{"field":"activityStatusId","oldValue":null,"newValue":1},{"field":"visibility","oldValue":null,"newValue":"team"}]'::jsonb,
      'Created for Langley agriculture visit tracking.',
      TIMESTAMPTZ '2026-02-21 08:55:00-08'
    ),
    (
      24,
      15,
      'updated',
      '[{"field":"significance","oldValue":"It helps small operators plan with fewer unknowns.","newValue":"It helps small operators plan with fewer unknowns. The changes are small on paper but add up across a year of errands, commitments and bills."}]'::jsonb,
      'Expanded significance for media lines.',
      TIMESTAMPTZ '2026-02-26 12:10:00-08'
    ),
    (
      24,
      20,
      'note_added',
      NULL,
      'BCS sync completed; keep monitoring for any late ministry edits.',
      TIMESTAMPTZ '2026-03-01 09:40:00-08'
    ),
    (
      33,
      11,
      'created',
      '[{"field":"activityStatusId","oldValue":null,"newValue":1},{"field":"isAllDay","oldValue":null,"newValue":false}]'::jsonb,
      'Initial forestry entry created from weekly roll-up.',
      TIMESTAMPTZ '2026-03-03 10:20:00-08'
    ),
    (
      33,
      18,
      'reviewed',
      '[{"field":"activityStatusId","oldValue":1,"newValue":2}]'::jsonb,
      'Reviewed and ready for publication planning.',
      TIMESTAMPTZ '2026-03-05 15:35:00-08'
    ),
    (
      47,
      7,
      'updated',
      '[{"field":"isConfidential","oldValue":false,"newValue":true},{"field":"notes","oldValue":null,"newValue":"Hold details until stakeholder outreach is complete."}]'::jsonb,
      'Confidential flag added pending partner confirmation.',
      TIMESTAMPTZ '2026-03-12 11:05:00-07'
    ),
    (
      47,
      19,
      'changes_cancelled',
      '[{"field":"isConfidential","oldValue":true,"newValue":false}]'::jsonb,
      'Reverted draft-only edits after review discussion.',
      TIMESTAMPTZ '2026-03-15 16:10:00-07'
    ),
    (
      60,
      14,
      'soft_deleted',
      '[{"field":"activityStatusId","oldValue":2,"newValue":4}]'::jsonb,
      'Marked deleted after identifying a likely duplicate capital projects item.',
      TIMESTAMPTZ '2026-03-20 13:25:00-07'
    ),
    (
      60,
      20,
      'restored',
      '[{"field":"activityStatusId","oldValue":4,"newValue":2}]'::jsonb,
      'Restored for demo data after duplicate check failed.',
      TIMESTAMPTZ '2026-03-23 09:05:00-07'
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