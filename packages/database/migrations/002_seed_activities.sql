-- Seed Script for Activities
-- This script seeds the activities table with sample data
-- Run this after applying the lookup tables seed (001_seed_lookup_tables.sql)

-- ============================================================================
-- ACTIVITIES
-- Sample calendar activities with various statuses and configurations
-- ============================================================================

INSERT INTO activities (
  id,
  display_id,
  start_date,
  start_time,
  end_date,
  end_time,
  scheduling_status_id,
  scheduling_considerations,
  title,
  summary,
  comments,
  venue,
  venue_address,
  significance,
  pitch_comments,
  entry_status_id,
  pitch_status_id,
  lead_org_id,
  event_lead_org_id,
  comms_lead_id,
  event_lead_id,
  graphics_user_id,
  owner_id,
  contact_ministry_id,
  city_id,
  is_all_day,
  is_time_confirmed,
  is_date_confirmed,
  oic_related,
  not_for_look_ahead,
  planning_report,
  thirty_sixty_ninety_report,
  is_active,
  is_confidential,
  is_issue,
  look_ahead_status,
  look_ahead_section,
  calendar_visibility,
  hq_section,
  created_date_time,
  created_by,
  last_updated_date_time,
  last_updated_by,
  row_version,
  row_guid
) VALUES
  (
    1,
    'PREM-000001',
    '2025-03-15',
    '10:00:00',
    '2025-03-15',
    '12:00:00',
    3,
    'Event requires security clearance. Media will be present.',
    'Premier''s Address on Climate Action',
    'The Premier will deliver a keynote address on British Columbia''s climate action plan and renewable energy initiatives. The event will highlight new investments in clean technology and partnerships with First Nations communities.',
    'Media advisory sent. Q&As prepared.',
    'Vancouver Convention Centre',
    '{"street": "1055 Canada Place", "city": "Vancouver", "provinceOrState": "BC", "country": "Canada"}'::jsonb,
    'High-profile announcement expected to generate significant media coverage. Coordination with multiple ministries required.',
    'Pitch approved by communications director.',
    3,
    4,
    '00000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000001',
    2,
    3,
    4,
    1,
    '00000000-0000-4000-8000-000000000008',
    2,
    false,
    true,
    true,
    false,
    false,
    true,
    false,
    true,
    false,
    false,
    'new',
    'events',
    'visible',
    0,
    '2025-01-15 09:00:00-08',
    1,
    '2025-01-20 14:30:00-08',
    2,
    1,
    gen_random_uuid()
  ),
  (
    2,
    'HLTH-000002',
    '2025-03-20',
    '14:00:00',
    '2025-03-20',
    '15:30:00',
    2,
    'Tentative timing pending confirmation from Minister''s office.',
    'Health Care Facility Opening',
    'Official opening ceremony for the new community health centre in Victoria. The Minister of Health will cut the ribbon and tour the facility.',
    'Event planner coordinating logistics.',
    'Victoria Community Health Centre',
    '{"street": "1234 Government Street", "city": "Victoria", "provinceOrState": "BC", "country": "Canada"}'::jsonb,
    'Important community milestone. Local media expected.',
    NULL,
    2,
    2,
    '00000000-0000-4000-8000-000000000012',
    '00000000-0000-4000-8000-000000000012',
    3,
    2,
    NULL,
    2,
    '00000000-0000-4000-8000-000000000012',
    1,
    false,
    false,
    true,
    false,
    false,
    false,
    false,
    true,
    false,
    false,
    'new',
    'events',
    'visible',
    0,
    '2025-01-18 10:00:00-08',
    2,
    '2025-01-22 11:15:00-08',
    3,
    1,
    gen_random_uuid()
  ),
  (
    3,
    'EDUC-000003',
    '2025-04-01',
    NULL,
    '2025-04-01',
    NULL,
    1,
    'All-day event. Specific times to be confirmed.',
    'Education Summit 2025',
    'Annual education summit bringing together educators, administrators, and policy makers to discuss innovations in K-12 education and early childhood development programs.',
    'Multi-day event. Detailed schedule pending.',
    'Kelowna Conference Centre',
    '{"street": "1310 Water Street", "city": "Kelowna", "provinceOrState": "BC", "country": "Canada"}'::jsonb,
    'Major policy announcement expected. Provincial significance.',
    'Pitch submission in progress.',
    1,
    2,
    '00000000-0000-4000-8000-000000000006',
    '00000000-0000-4000-8000-000000000006',
    4,
    3,
    2,
    3,
    '00000000-0000-4000-8000-000000000006',
    3,
    true,
    false,
    false,
    false,
    true,
    true,
    false,
    true,
    false,
    false,
    'new',
    'events',
    'visible',
    0,
    '2025-01-10 08:00:00-08',
    3,
    '2025-01-25 16:45:00-08',
    4,
    1,
    gen_random_uuid()
  ),
  (
    4,
    'ENV-000004',
    '2025-03-25',
    '09:00:00',
    '2025-03-25',
    '16:00:00',
    3,
    'Confirmed schedule. Field trip component included.',
    'Forest Conservation Initiative Announcement',
    'Announcement of new protected areas and forest conservation partnerships. Includes field visit to conservation site and media availability.',
    'Transportation arranged. Safety briefing required.',
    'Prince George Regional Office',
    '{"street": "4567 5th Avenue", "city": "Prince George", "provinceOrState": "BC", "country": "Canada"}'::jsonb,
    'Significant environmental policy announcement. National media interest expected.',
    'Pitch approved. Key messages finalized.',
    3,
    4,
    '00000000-0000-4000-8000-000000000009',
    '00000000-0000-4000-8000-000000000011',
    2,
    4,
    3,
    1,
    '00000000-0000-4000-8000-000000000009',
    6,
    false,
    true,
    true,
    true,
    false,
    false,
    false,
    true,
    false,
    false,
    'changed',
    'events',
    'visible',
    0,
    '2025-01-12 13:00:00-08',
    1,
    '2025-01-24 10:20:00-08',
    2,
    2,
    gen_random_uuid()
  ),
  (
    5,
    'HOUS-000005',
    '2025-04-10',
    '11:00:00',
    '2025-04-10',
    '12:00:00',
    3,
    'Confirmed. Media scrum following announcement.',
    'Affordable Housing Project Groundbreaking',
    'Groundbreaking ceremony for new affordable housing development in Vancouver. Minister will speak and participate in ceremonial shovel turn.',
    'Site visit completed. Logistics confirmed.',
    'Vancouver Housing Development Site',
    '{"street": "789 Main Street", "city": "Vancouver", "provinceOrState": "BC", "country": "Canada"}'::jsonb,
    'High-profile housing announcement. Part of provincial housing strategy rollout.',
    'Pitch approved. Media kit prepared.',
    3,
    4,
    '00000000-0000-4000-8000-000000000013',
    '00000000-0000-4000-8000-000000000013',
    3,
    2,
    4,
    2,
    '00000000-0000-4000-8000-000000000013',
    2,
    false,
    true,
    true,
    false,
    false,
    false,
    false,
    true,
    false,
    false,
    'new',
    'events',
    'visible',
    0,
    '2025-01-20 09:30:00-08',
    2,
    '2025-01-26 15:00:00-08',
    3,
    1,
    gen_random_uuid()
  )
ON CONFLICT (id) DO UPDATE
  SET display_id = EXCLUDED.display_id,
      start_date = EXCLUDED.start_date,
      start_time = EXCLUDED.start_time,
      end_date = EXCLUDED.end_date,
      end_time = EXCLUDED.end_time,
      scheduling_status_id = EXCLUDED.scheduling_status_id,
      scheduling_considerations = EXCLUDED.scheduling_considerations,
      title = EXCLUDED.title,
      summary = EXCLUDED.summary,
      comments = EXCLUDED.comments,
      venue = EXCLUDED.venue,
      venue_address = EXCLUDED.venue_address,
      significance = EXCLUDED.significance,
      pitch_comments = EXCLUDED.pitch_comments,
      entry_status_id = EXCLUDED.entry_status_id,
      pitch_status_id = EXCLUDED.pitch_status_id,
      lead_org_id = EXCLUDED.lead_org_id,
      event_lead_org_id = EXCLUDED.event_lead_org_id,
      comms_lead_id = EXCLUDED.comms_lead_id,
      event_lead_id = EXCLUDED.event_lead_id,
      graphics_user_id = EXCLUDED.graphics_user_id,
      owner_id = EXCLUDED.owner_id,
      contact_ministry_id = EXCLUDED.contact_ministry_id,
      city_id = EXCLUDED.city_id,
      is_all_day = EXCLUDED.is_all_day,
      is_time_confirmed = EXCLUDED.is_time_confirmed,
      is_date_confirmed = EXCLUDED.is_date_confirmed,
      oic_related = EXCLUDED.oic_related,
      not_for_look_ahead = EXCLUDED.not_for_look_ahead,
      planning_report = EXCLUDED.planning_report,
      thirty_sixty_ninety_report = EXCLUDED.thirty_sixty_ninety_report,
      is_active = EXCLUDED.is_active,
      is_confidential = EXCLUDED.is_confidential,
      is_issue = EXCLUDED.is_issue,
      look_ahead_status = EXCLUDED.look_ahead_status,
      look_ahead_section = EXCLUDED.look_ahead_section,
      calendar_visibility = EXCLUDED.calendar_visibility,
      hq_section = EXCLUDED.hq_section,
      created_date_time = EXCLUDED.created_date_time,
      created_by = EXCLUDED.created_by,
      last_updated_date_time = EXCLUDED.last_updated_date_time,
      last_updated_by = EXCLUDED.last_updated_by,
      row_version = EXCLUDED.row_version,
      row_guid = EXCLUDED.row_guid;

-- ============================================================================
-- ACTIVITY CATEGORIES
-- Link activities to categories
-- ============================================================================

INSERT INTO activity_categories (activity_id, category_id, is_active, created_by, last_updated_by) VALUES
  (1, 1, true, 1, 2),
  (1, 7, true, 1, 2),
  (2, 1, true, 2, 3),
  (3, 4, true, 3, 4),
  (3, 7, true, 3, 4),
  (4, 2, true, 1, 2),
  (4, 1, true, 1, 2),
  (5, 1, true, 2, 3)
ON CONFLICT (activity_id, category_id) DO UPDATE
  SET is_active = EXCLUDED.is_active,
      last_updated_by = EXCLUDED.last_updated_by,
      last_updated_date_time = now();

-- ============================================================================
-- ACTIVITY THEMES
-- Link activities to themes
-- ============================================================================

INSERT INTO activity_themes (activity_id, theme_id, is_active, created_by, last_updated_by) VALUES
  (1, '00000000-0000-4000-8000-000000000203', true, 1, 2),
  (2, '00000000-0000-4000-8000-000000000201', true, 2, 3),
  (3, '00000000-0000-4000-8000-000000000202', true, 3, 4),
  (4, '00000000-0000-4000-8000-000000000203', true, 1, 2),
  (5, '00000000-0000-4000-8000-000000000206', true, 2, 3)
ON CONFLICT (activity_id, theme_id) DO UPDATE
  SET is_active = EXCLUDED.is_active,
      last_updated_by = EXCLUDED.last_updated_by,
      last_updated_date_time = now();

-- ============================================================================
-- ACTIVITY TAGS
-- Link activities to tags
-- ============================================================================

INSERT INTO activity_tags (activity_id, tag_id, is_active, created_by, last_updated_by) VALUES
  (1, '00000000-0000-4000-8000-000000000104', true, 1, 2),
  (2, '00000000-0000-4000-8000-000000000105', true, 2, 3),
  (3, '00000000-0000-4000-8000-000000000104', true, 3, 4),
  (4, '00000000-0000-4000-8000-000000000104', true, 1, 2),
  (5, '00000000-0000-4000-8000-000000000105', true, 2, 3)
ON CONFLICT (activity_id, tag_id) DO UPDATE
  SET is_active = EXCLUDED.is_active,
      last_updated_by = EXCLUDED.last_updated_by,
      last_updated_date_time = now();

-- ============================================================================
-- ACTIVITY JOINT ORGANIZATIONS
-- Link activities to joint organizations
-- ============================================================================

INSERT INTO activity_joint_organizations (activity_id, organization_id, is_active, created_by, last_updated_by) VALUES
  (1, '00000000-0000-4000-8000-000000000008', true, 1, 2),
  (4, '00000000-0000-4000-8000-000000000011', true, 1, 2),
  (4, '00000000-0000-4000-8000-000000000014', true, 1, 2)
ON CONFLICT (activity_id, organization_id) DO UPDATE
  SET is_active = EXCLUDED.is_active,
      last_updated_by = EXCLUDED.last_updated_by,
      last_updated_date_time = now();

-- ============================================================================
-- ACTIVITY COMMS MATERIALS
-- Link activities to communication materials
-- ============================================================================

INSERT INTO activity_comms_materials (activity_id, comms_material_id, is_active, created_by, last_updated_by) VALUES
  (1, 1, true, 1, 2),
  (1, 3, true, 1, 2),
  (1, 4, true, 1, 2),
  (2, 1, true, 2, 3),
  (4, 1, true, 1, 2),
  (4, 3, true, 1, 2),
  (4, 4, true, 1, 2),
  (5, 1, true, 2, 3),
  (5, 4, true, 2, 3)
ON CONFLICT (activity_id, comms_material_id) DO UPDATE
  SET is_active = EXCLUDED.is_active,
      last_updated_by = EXCLUDED.last_updated_by,
      last_updated_date_time = now();

-- ============================================================================
-- ACTIVITY TRANSLATION LANGUAGES
-- Link activities to translation languages
-- ============================================================================

INSERT INTO activity_translation_languages (activity_id, language_id, is_active, created_by, last_updated_by) VALUES
  (1, 1, true, 1, 2),
  (1, 2, true, 1, 2),
  (2, 1, true, 2, 3),
  (4, 1, true, 1, 2),
  (5, 1, true, 2, 3),
  (5, 2, true, 2, 3)
ON CONFLICT (activity_id, language_id) DO UPDATE
  SET is_active = EXCLUDED.is_active,
      last_updated_by = EXCLUDED.last_updated_by,
      last_updated_date_time = now();

-- ============================================================================
-- ACTIVITY REPRESENTATIVES
-- Link activities to government representatives
-- ============================================================================

INSERT INTO activity_representatives (activity_id, representative_id, representative_name, attending_status, is_active, created_by, last_updated_by) VALUES
  (1, 1000, 'Premier David Eby', 'confirmed', true, 1, 2),
  (2, 2012, 'Minister Josie Osborne', 'confirmed', true, 2, 3),
  (3, 2006, 'Minister Lisa Beare', 'requested', true, 3, 4),
  (4, 2009, 'Minister Tamara Davidson', 'confirmed', true, 1, 2),
  (4, 2011, 'Minister Ravi Parmar', 'confirmed', true, 1, 2),
  (5, 2013, 'Minister Christine Boyle', 'confirmed', true, 2, 3)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- ACTIVITY SHARED WITH ORGANIZATIONS
-- Link activities to organizations that can view them
-- ============================================================================

INSERT INTO activity_shared_with_organizations (activity_id, organization_id, is_active, created_by, last_updated_by) VALUES
  (1, '00000000-0000-4000-8000-000000000008', true, 1, 2),
  (4, '00000000-0000-4000-8000-000000000011', true, 1, 2),
  (4, '00000000-0000-4000-8000-000000000014', true, 1, 2)
ON CONFLICT (activity_id, organization_id) DO UPDATE
  SET is_active = EXCLUDED.is_active,
      last_updated_by = EXCLUDED.last_updated_by,
      last_updated_date_time = now();

