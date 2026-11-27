-- Legacy activity flat-table sample data.
-- This is intentionally a small, search-friendly projection of historical rows.
-- It is not a full migration of the legacy record set and is meant to support local testing.

INSERT INTO legacy_activities (
  display_id,
  external_reference,
  title,
  summary,
  start_date,
  end_date,
  activity_status_id,
  look_ahead_status,
  lead_org_name,
  ministry_name,
  location_name,
  searchable_text,
  raw_record,
  created_date_time,
  imported_at,
  last_reviewed_at
) VALUES
  (
    'LEG-1001',
    'LEG-1001',
    'Minister update for North Coast region',
    'Legacy record describing a ministerial regional update for agriculture and community investment.',
    '2025-01-14',
    '2025-01-15',
    (SELECT id FROM activity_statuses WHERE name = 'archived'),
    'changed',
    'Ministry of Agriculture and Food',
    'Agriculture and Food',
    'Prince Rupert',
    'minister update north coast region agriculture food prince rupert archived legacy activity',
    '{
      "id": "LEG-1001",
      "title": "Minister update for North Coast region",
      "status": "Archived ",
      "category": ["Announcement", "Community"],
      "confidential": false,
      "issue": false,
      "tags": ["North Coast", "Investment"],
      "significance": "Regional update on community investment.",
      "notes": "Prepared for the regional team.",
      "executiveSummary": "The minister will provide a regional update on community investment.",
      "commsMaterials": ["News release", "Social media"],
      "commsContactName": "Jordan Lee",
      "newsReleaseOrigin": "Ministry",
      "newsReleaseDistribution": "Province-wide",
      "translations": ["French", "Punjabi"],
      "premierStatus": "Requested",
      "governmentRepresentatives": ["Minister of Agriculture and Food"],
      "eventPlanners": ["Regional events team"],
      "venueCity": "Community Hall, Prince Rupert",
      "summary": "Legacy record describing a ministerial regional update for agriculture and community investment.",
      "lead_org_name": "Ministry of Agriculture and Food",
      "location": "Prince Rupert",
      "legacy_fields": {
        "hq_status": "changed",
        "owner": "regional team"
      }
    }'::jsonb,
    NULL,
    NOW(),
    NOW()
  ),
  (
    'LEG-2002',
    'LEG-2002',
    'Attorney General public safety briefing',
    'Historical briefing on digital filing process improvements and cross-agency victim services coordination.',
    '2024-11-07',
    '2024-11-07',
    (SELECT id FROM activity_statuses WHERE name = 'archived'),
    'new',
    'Ministry of Public Safety and Solicitor General',
    'Public Safety and Solicitor General',
    'Burnaby',
    'attorney general public safety briefing burnaby digital filing victim services archived legacy record',
    '{
      "id": "LEG-2002",
      "title": "Attorney General public safety briefing",
      "status": "Archived",
      "summary": "Historical briefing on digital filing process improvements and cross-agency victim services coordination.",
      "lead_org_name": "Ministry of Public Safety and Solicitor General",
      "location": "Burnaby",
      "legacy_fields": {
        "hq_status": "new",
        "contact": "civil justice team"
      }
    }'::jsonb,
    NULL,
    NOW(),
    NOW()
  ),
  (
    'LEG-3003',
    'LEG-3003',
    'Education classroom expansion announcement',
    'Archived legacy education announcement related to classroom additions and early learning facilities.',
    '2023-09-20',
    '2023-09-21',
    (SELECT id FROM activity_statuses WHERE name = 'archived'),
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
    NULL,
    NOW(),
    NOW()
  );
