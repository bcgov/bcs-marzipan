-- Legacy activity flat-table sample data.
-- This is intentionally a small, search-friendly projection of historical rows.
-- It is not a full migration of the legacy record set and is meant to support local testing.

INSERT INTO legacy_activities (
  source_system,
  source_table,
  source_record_id,
  external_reference,
  matched_activity_id,
  title,
  summary,
  start_date,
  end_date,
  status_name,
  look_ahead_status,
  lead_org_name,
  ministry_name,
  location_name,
  searchable_text,
  raw_record,
  imported_at,
  last_reviewed_at,
  is_archived
) VALUES
  (
    'legacy',
    'activity',
    'LEG-1001',
    'LEG-1001',
    NULL,
    'Minister update for North Coast region',
    'Legacy record describing a ministerial regional update for agriculture and community investment.',
    '2025-01-14',
    '2025-01-15',
    'Reviewed',
    'changed',
    'Ministry of Agriculture and Food',
    'Agriculture and Food',
    'Prince Rupert',
    'minister update north coast region agriculture food prince rupert reviewed legacy activity',
    '{
      "id": "LEG-1001",
      "title": "Minister update for North Coast region",
      "status": "Reviewed",
      "summary": "Legacy record describing a ministerial regional update for agriculture and community investment.",
      "lead_org_name": "Ministry of Agriculture and Food",
      "location": "Prince Rupert",
      "legacy_fields": {
        "hq_status": "changed",
        "owner": "regional team"
      }
    }'::jsonb,
    NOW(),
    NOW(),
    false
  ),
  (
    'legacy',
    'activity',
    'LEG-2002',
    'LEG-2002',
    1,
    'Attorney General public safety briefing',
    'Historical briefing on digital filing process improvements and cross-agency victim services coordination.',
    '2024-11-07',
    '2024-11-07',
    'Completed',
    'new',
    'Ministry of Public Safety and Solicitor General',
    'Public Safety and Solicitor General',
    'Burnaby',
    'attorney general public safety briefing burnaby digital filing victim services completed legacy record',
    '{
      "id": "LEG-2002",
      "title": "Attorney General public safety briefing",
      "status": "Completed",
      "summary": "Historical briefing on digital filing process improvements and cross-agency victim services coordination.",
      "lead_org_name": "Ministry of Public Safety and Solicitor General",
      "location": "Burnaby",
      "legacy_fields": {
        "hq_status": "new",
        "contact": "civil justice team"
      }
    }'::jsonb,
    NOW(),
    NOW(),
    false
  ),
  (
    'legacy',
    'activity',
    'LEG-3003',
    'LEG-3003',
    NULL,
    'Education classroom expansion announcement',
    'Archived legacy education announcement related to classroom additions and early learning facilities.',
    '2023-09-20',
    '2023-09-21',
    'Archived',
    'none',
    'Ministry of Education and Child Care',
    'Education and Child Care',
    'Skeena',
    'education classroom expansion announcement skeena archived legacy activity',
    '{
      "id": "LEG-3003",
      "title": "Education classroom expansion announcement",
      "status": "Archived",
      "summary": "Archived legacy education announcement related to classroom additions and early learning facilities.",
      "lead_org_name": "Ministry of Education and Child Care",
      "location": "Skeena",
      "legacy_fields": {
        "hq_status": "none",
        "archive_reason": "superseded"
      }
    }'::jsonb,
    NOW(),
    NOW(),
    true
  );
