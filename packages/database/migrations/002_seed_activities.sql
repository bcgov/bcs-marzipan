-- Seed Script for Activities
-- This script seeds the activities table with sample data
-- Run this after applying the lookup tables seed (001_seed_lookup_tables.sql)

-- ============================================================================
-- SYSTEM USERS
-- System users for authentication and authorization
-- Must be seeded first as activities reference these users
-- ============================================================================

INSERT INTO system_users (id, ad_username, ad_display_name, ad_email, ad_department, role, is_active) VALUES
  (1, 'john.doe', 'John Doe', 'john.doe@gov.bc.ca', 'Office of the Premier', 'Admin', true),
  (2, 'jane.smith', 'Jane Smith', 'jane.smith@gov.bc.ca', 'Communications', 'Editor', true),
  (3, 'sam.wilson', 'Sam Wilson', 'sam.wilson@gov.bc.ca', 'Public Affairs', 'Editor', true),
  (4, 'david.chen', 'David Chen', 'david.chen@gov.bc.ca', 'Media Relations', 'Editor', true),
  (5, 'emily.wang', 'Emily Wang', 'emily.wang@gov.bc.ca', 'Policy', 'ReadOnly', true),
  (6, 'michael.brown', 'Michael Brown', 'michael.brown@gov.bc.ca', 'Research', 'ReadOnly', true)
ON CONFLICT (id) DO NOTHING;

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
  date_status_id,
  time_status_id,
  scheduling_considerations,
  title,
  summary,
  venue_status_id,
  significance,
  pitch_comments,
  activity_status_id,
  pitch_status_id,
  lead_org_id,
  lead_org_name,
  event_lead_org_id,
  event_lead_org_name,
  event_lead_id,
  event_lead_name,
  graphics_user_id,
  owner_id,
  ministry_owner_id,
  news_release_origin_id,
  news_release_origin_name,
  is_all_day,
  not_for_look_ahead,
  not_for_thirty_sixty_ninety,
  is_active,
  is_issue,
  look_ahead_status,
  look_ahead_section,
  calendar_visibility,
  created_date_time,
  created_by,
  last_updated_date_time,
  last_updated_by,
  row_version
) VALUES
  (
    1,
    'PREM-000001',
    '2025-03-15',
    '10:00:00',
    '2025-03-15',
    '12:00:00',
    3,
    3,
    'Event requires security clearance. Media will be present.',
    'Premier''s Address on Climate Action',
    'The Premier will deliver a keynote address on British Columbia''s climate action plan and renewable energy initiatives. The event will highlight new investments in clean technology and partnerships with First Nations communities.',
    3,
    'High-profile announcement expected to generate significant media coverage. Coordination with multiple ministries required.',
    'Pitch approved by communications director.',
    3,
    4,
    '00000000-0000-4000-8000-000000000001',
    NULL,
    '00000000-0000-4000-8000-000000000001',
    NULL,
    3,
    NULL,
    4,
    1,
    '00000000-0000-4000-8000-000000000008',
    NULL,
    '',
    false,
    false,
    false,
    true,
    false,
    'new',
    'events',
    'visible',
    '2025-01-15 09:00:00-08',
    1,
    '2025-01-20 14:30:00-08',
    2,
    1
  ),
  (
    2,
    'HLTH-000002',
    '2025-03-20',
    '14:00:00',
    '2025-03-20',
    '15:30:00',
    2,
    2,
    'Tentative timing pending confirmation from Minister''s office.',
    'Health Care Facility Opening',
    'Official opening ceremony for the new community health centre in Victoria. The Minister of Health will cut the ribbon and tour the facility.',
    2,
    'Important community milestone. Local media expected.',
    NULL,
    2,
    2,
    '00000000-0000-4000-8000-000000000012',
    NULL,
    '00000000-0000-4000-8000-000000000012',
    NULL,
    2,
    NULL,
    NULL,
    2,
    '00000000-0000-4000-8000-000000000012',
    NULL,
    '',
    false,
    false,
    false,
    true,
    false,
    'new',
    'events',
    'visible',
    '2025-01-18 10:00:00-08',
    2,
    '2025-01-22 11:15:00-08',
    3,
    1
  ),
  (
    3,
    'EDUC-000003',
    '2025-04-01',
    NULL,
    '2025-04-01',
    NULL,
    1,
    1,
    'All-day event. Specific times to be confirmed.',
    'Education Summit 2025',
    'Annual education summit bringing together educators, administrators, and policy makers to discuss innovations in K-12 education and early childhood development programs.',
    1,
    'Major policy announcement expected. Provincial significance.',
    'Pitch submission in progress.',
    1,
    2,
    '00000000-0000-4000-8000-000000000006',
    NULL,
    '00000000-0000-4000-8000-000000000006',
    NULL,
    3,
    NULL,
    2,
    3,
    '00000000-0000-4000-8000-000000000006',
    NULL,
    '',
    true,
    true,
    true,
    true,
    false,
    'new',
    'events',
    'visible',
    '2025-01-10 08:00:00-08',
    3,
    '2025-01-25 16:45:00-08',
    4,
    1
  ),
  (
    4,
    'ENV-000004',
    '2025-03-25',
    '09:00:00',
    '2025-03-25',
    '16:00:00',
    3,
    3,
    'Confirmed schedule. Field trip component included.',
    'Forest Conservation Initiative Announcement',
    'Announcement of new protected areas and forest conservation partnerships. Includes field visit to conservation site and media availability.',
    3,
    'Significant environmental policy announcement. National media interest expected.',
    'Pitch approved. Key messages finalized.',
    3,
    4,
    '00000000-0000-4000-8000-000000000009',
    NULL,
    '00000000-0000-4000-8000-000000000011',
    NULL,
    4,
    NULL,
    3,
    1,
    '00000000-0000-4000-8000-000000000009',
    NULL,
    '',
    false,
    false,
    false,
    true,
    false,
    'changed',
    'events',
    'visible',
    '2025-01-12 13:00:00-08',
    1,
    '2025-01-24 10:20:00-08',
    2,
    2
  ),
  (
    5,
    'HOUS-000005',
    '2025-04-10',
    '11:00:00',
    '2025-04-10',
    '12:00:00',
    3,
    3,
    'Confirmed. Media scrum following announcement.',
    'Affordable Housing Project Groundbreaking',
    'Groundbreaking ceremony for new affordable housing development in Vancouver. Minister will speak and participate in ceremonial shovel turn.',
    3,
    'High-profile housing announcement. Part of provincial housing strategy rollout.',
    'Pitch approved. Media kit prepared.',
    3,
    4,
    '00000000-0000-4000-8000-000000000013',
    NULL,
    '00000000-0000-4000-8000-000000000013',
    NULL,
    2,
    NULL,
    4,
    2,
    '00000000-0000-4000-8000-000000000013',
    NULL,
    '',
    false,
    false,
    false,
    true,
    false,
    'new',
    'events',
    'visible',
    '2025-01-20 09:30:00-08',
    2,
    '2025-01-26 15:00:00-08',
    3,
    1
  )
ON CONFLICT (id) DO UPDATE
  SET display_id = EXCLUDED.display_id,
      start_date = EXCLUDED.start_date,
      start_time = EXCLUDED.start_time,
      end_date = EXCLUDED.end_date,
      end_time = EXCLUDED.end_time,
      date_status_id = EXCLUDED.date_status_id,
      time_status_id = EXCLUDED.time_status_id,
      scheduling_considerations = EXCLUDED.scheduling_considerations,
      title = EXCLUDED.title,
      summary = EXCLUDED.summary,
      venue_status_id = EXCLUDED.venue_status_id,
      significance = EXCLUDED.significance,
      pitch_comments = EXCLUDED.pitch_comments,
      activity_status_id = EXCLUDED.activity_status_id,
      pitch_status_id = EXCLUDED.pitch_status_id,
      lead_org_id = EXCLUDED.lead_org_id,
      lead_org_name = EXCLUDED.lead_org_name,
      event_lead_org_id = EXCLUDED.event_lead_org_id,
      event_lead_org_name = EXCLUDED.event_lead_org_name,
      event_lead_id = EXCLUDED.event_lead_id,
      event_lead_name = EXCLUDED.event_lead_name,
      graphics_user_id = EXCLUDED.graphics_user_id,
      owner_id = EXCLUDED.owner_id,
      ministry_owner_id = EXCLUDED.ministry_owner_id,
      news_release_origin_id = EXCLUDED.news_release_origin_id,
      news_release_origin_name = EXCLUDED.news_release_origin_name,
      is_all_day = EXCLUDED.is_all_day,
      not_for_look_ahead = EXCLUDED.not_for_look_ahead,
      not_for_thirty_sixty_ninety = EXCLUDED.not_for_thirty_sixty_ninety,
      is_active = EXCLUDED.is_active,
      is_issue = EXCLUDED.is_issue,
      look_ahead_status = EXCLUDED.look_ahead_status,
      look_ahead_section = EXCLUDED.look_ahead_section,
      calendar_visibility = EXCLUDED.calendar_visibility,
      created_date_time = EXCLUDED.created_date_time,
      created_by = EXCLUDED.created_by,
      last_updated_date_time = EXCLUDED.last_updated_date_time,
      last_updated_by = EXCLUDED.last_updated_by,
      row_version = EXCLUDED.row_version;

-- ============================================================================
-- VENUE ADDRESSES
-- Link venue address information to activities
-- ============================================================================

INSERT INTO venue_addresses (activity_id, venue_name, street, city, province_or_state, country) VALUES
  (1, 'Vancouver Convention Centre', '1055 Canada Place', 'Vancouver', 'BC', 'Canada'),
  (2, 'Victoria Community Health Centre', '1234 Government Street', 'Victoria', 'BC', 'Canada'),
  (3, 'Kelowna Conference Centre', '1310 Water Street', 'Kelowna', 'BC', 'Canada'),
  (4, 'Prince George Regional Office', '4567 5th Avenue', 'Prince George', 'BC', 'Canada'),
  (5, 'Vancouver Housing Development Site', '789 Main Street', 'Vancouver', 'BC', 'Canada')
ON CONFLICT (activity_id) DO UPDATE
  SET venue_name = EXCLUDED.venue_name,
      street = EXCLUDED.street,
      city = EXCLUDED.city,
      province_or_state = EXCLUDED.province_or_state,
      country = EXCLUDED.country;

-- ============================================================================
-- ACTIVITY CATEGORIES
-- Link activities to categories
-- ============================================================================

INSERT INTO activity_categories (activity_id, category_id, is_active, timestamp) VALUES
  (1, 1, true, now()),
  (1, 7, true, now()),
  (2, 1, true, now()),
  (3, 4, true, now()),
  (3, 7, true, now()),
  (4, 2, true, now()),
  (4, 1, true, now()),
  (5, 1, true, now())
ON CONFLICT (activity_id, category_id) DO UPDATE
  SET is_active = EXCLUDED.is_active,
      timestamp = now();

-- ============================================================================
-- ACTIVITY THEMES
-- Link activities to themes
-- ============================================================================

INSERT INTO activity_themes (activity_id, theme_id, is_active, timestamp) VALUES
  (1, '00000000-0000-4000-8000-000000000203', true, now()),
  (2, '00000000-0000-4000-8000-000000000201', true, now()),
  (3, '00000000-0000-4000-8000-000000000202', true, now()),
  (4, '00000000-0000-4000-8000-000000000203', true, now()),
  (5, '00000000-0000-4000-8000-000000000206', true, now())
ON CONFLICT (activity_id, theme_id) DO UPDATE
  SET is_active = EXCLUDED.is_active,
      timestamp = now();

-- ============================================================================
-- ACTIVITY TAGS
-- Link activities to tags
-- ============================================================================

INSERT INTO activity_tags (activity_id, tag_id, is_active, timestamp) VALUES
  (1, '00000000-0000-4000-8000-000000000104', true, now()),
  (2, '00000000-0000-4000-8000-000000000105', true, now()),
  (3, '00000000-0000-4000-8000-000000000104', true, now()),
  (4, '00000000-0000-4000-8000-000000000104', true, now()),
  (5, '00000000-0000-4000-8000-000000000105', true, now())
ON CONFLICT (activity_id, tag_id) DO UPDATE
  SET is_active = EXCLUDED.is_active,
      timestamp = now();

-- ============================================================================
-- ACTIVITY JOINT ORGANIZATIONS
-- Link activities to joint organizations
-- ============================================================================

INSERT INTO activity_joint_organizations (activity_id, organization_id, is_active, timestamp) VALUES
  (1, '00000000-0000-4000-8000-000000000008', true, now()),
  (4, '00000000-0000-4000-8000-000000000011', true, now()),
  (4, '00000000-0000-4000-8000-000000000014', true, now())
ON CONFLICT (activity_id, organization_id) DO UPDATE
  SET is_active = EXCLUDED.is_active,
      timestamp = now();

-- ============================================================================
-- ACTIVITY COMMS MATERIALS
-- Link activities to communication materials
-- ============================================================================

INSERT INTO activity_comms_materials (activity_id, comms_material_id, is_active, timestamp) VALUES
  (1, 1, true, now()),
  (1, 3, true, now()),
  (1, 4, true, now()),
  (2, 1, true, now()),
  (4, 1, true, now()),
  (4, 3, true, now()),
  (4, 4, true, now()),
  (5, 1, true, now()),
  (5, 4, true, now())
ON CONFLICT (activity_id, comms_material_id) DO UPDATE
  SET is_active = EXCLUDED.is_active,
      timestamp = now();

-- ============================================================================
-- ACTIVITY TRANSLATION LANGUAGES
-- Link activities to translation languages
-- ============================================================================

INSERT INTO activity_translation_languages (activity_id, language_id, is_active, timestamp) VALUES
  (1, 1, true, now()),
  (1, 2, true, now()),
  (2, 1, true, now()),
  (4, 1, true, now()),
  (5, 1, true, now()),
  (5, 2, true, now())
ON CONFLICT (activity_id, language_id) DO UPDATE
  SET is_active = EXCLUDED.is_active,
      timestamp = now();

-- ============================================================================
-- ACTIVITY REPRESENTATIVES
-- Link activities to government representatives
-- ============================================================================

INSERT INTO activity_representatives (activity_id, representative_id, representative_name, attending_status, is_active, timestamp)
SELECT * FROM (VALUES
  (1, 1000, 'Premier David Eby', 'confirmed', true, now()),
  (2, 2012, 'Minister Josie Osborne', 'confirmed', true, now()),
  (3, 2006, 'Minister Lisa Beare', 'requested', true, now()),
  (4, 2009, 'Minister Tamara Davidson', 'confirmed', true, now()),
  (4, 2011, 'Minister Ravi Parmar', 'confirmed', true, now()),
  (5, 2013, 'Minister Christine Boyle', 'confirmed', true, now())
) AS v(activity_id, representative_id, representative_name, attending_status, is_active, timestamp)
WHERE NOT EXISTS (
  SELECT 1 FROM activity_representatives 
  WHERE activity_representatives.activity_id = v.activity_id 
    AND activity_representatives.representative_id = v.representative_id
);

-- ============================================================================
-- ACTIVITY SHARED WITH MINISTRIES
-- Link activities to ministries that can view them
-- ============================================================================

INSERT INTO activity_shared_with_organizations (activity_id, ministry_id, is_active, timestamp) VALUES
  (1, '00000000-0000-4000-8000-000000000008', true, now()),
  (4, '00000000-0000-4000-8000-000000000011', true, now()),
  (4, '00000000-0000-4000-8000-000000000014', true, now())
ON CONFLICT (activity_id, ministry_id) DO UPDATE
  SET is_active = EXCLUDED.is_active,
      timestamp = now();

