-- Seed Script for Lookup Tables
-- This script seeds all lookup tables with their initial values
-- Based on the current schema definitions in src/schema/lookups.ts
-- Run this after applying the base migration (0000_brown_the_executioner.sql)
--
-- IMPORTANT: System users must be seeded first as other tables reference them
-- via created_by and last_updated_by foreign keys

-- ============================================================================
-- SYSTEM USERS
-- System users for authentication and authorization
-- MUST be seeded first as other tables reference them via created_by/last_updated_by
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
-- ACTIVITY STATUSES
-- Used for both activity entry status and field review statuses
-- Values: 'new', 'queued', 'reviewed', 'changed', 'paused', 'deleted'
-- ============================================================================

INSERT INTO activity_statuses (name, display_name, sort_order, is_active, description, created_by, last_updated_by)
SELECT * FROM (VALUES
  ('new', 'New', 1, true, 'Newly created entry', 1, 1),
  ('queued', 'Queued', 2, true, 'Entry is queued for review', 1, 1),
  ('reviewed', 'Reviewed', 3, true, 'Entry has been reviewed', 1, 1),
  ('changed', 'Changed', 4, true, 'Entry has been changed', 1, 1),
  ('paused', 'Paused', 5, true, 'Entry is paused', 1, 1),
  ('deleted', 'Deleted', 6, true, 'Entry is deleted', 1, 1)
) AS v(name, display_name, sort_order, is_active, description, created_by, last_updated_by)
WHERE NOT EXISTS (SELECT 1 FROM activity_statuses WHERE activity_statuses.name = v.name);

-- ============================================================================
-- PITCH STATUSES
-- Pitch approval statuses
-- Values: 'not required', 'submitted', 'pitched', 'approved'
-- ============================================================================

INSERT INTO pitch_statuses (name, display_name, sort_order, is_active, description, created_by, last_updated_by)
SELECT * FROM (VALUES
  ('not required', 'Not Required', 1, true, 'Pitch approval is not required', 1, 1),
  ('submitted', 'Submitted', 2, true, 'Pitch has been submitted', 1, 1),
  ('pitched', 'Pitched', 3, true, 'Pitch has been presented', 1, 1),
  ('approved', 'Approved', 4, true, 'Pitch has been approved', 1, 1)
) AS v(name, display_name, sort_order, is_active, description, created_by, last_updated_by)
WHERE NOT EXISTS (SELECT 1 FROM pitch_statuses WHERE pitch_statuses.name = v.name);

-- ============================================================================
-- DATE STATUSES
-- Date statuses for activities
-- Values: 'unknown', 'tentative', 'confirmed'
-- ============================================================================

INSERT INTO date_statuses (name, display_name, sort_order, is_active, description, created_by, last_updated_by)
SELECT * FROM (VALUES
  ('unknown', 'Unknown', 1, true, 'Date status is unknown', 1, 1),
  ('tentative', 'Tentative', 2, true, 'Date is tentatively scheduled', 1, 1),
  ('confirmed', 'Confirmed', 3, true, 'Date is confirmed', 1, 1)
) AS v(name, display_name, sort_order, is_active, description, created_by, last_updated_by)
WHERE NOT EXISTS (SELECT 1 FROM date_statuses WHERE date_statuses.name = v.name);

-- ============================================================================
-- TIME STATUSES
-- Time statuses for activities
-- Values: 'unknown', 'tentative', 'confirmed'
-- ============================================================================

INSERT INTO time_statuses (name, display_name, sort_order, is_active, description, created_by, last_updated_by)
SELECT * FROM (VALUES
  ('unknown', 'Unknown', 1, true, 'Time status is unknown', 1, 1),
  ('tentative', 'Tentative', 2, true, 'Time is tentatively scheduled', 1, 1),
  ('confirmed', 'Confirmed', 3, true, 'Time is confirmed', 1, 1)
) AS v(name, display_name, sort_order, is_active, description, created_by, last_updated_by)
WHERE NOT EXISTS (SELECT 1 FROM time_statuses WHERE time_statuses.name = v.name);

-- ============================================================================
-- VENUE STATUSES
-- Venue statuses for activities
-- Values: 'unknown', 'tentative', 'confirmed'
-- ============================================================================

INSERT INTO venue_statuses (name, display_name, sort_order, is_active, description, created_by, last_updated_by)
SELECT * FROM (VALUES
  ('unknown', 'Unknown', 1, true, 'Venue status is unknown', 1, 1),
  ('tentative', 'Tentative', 2, true, 'Venue is tentatively scheduled', 1, 1),
  ('confirmed', 'Confirmed', 3, true, 'Venue is confirmed', 1, 1)
) AS v(name, display_name, sort_order, is_active, description, created_by, last_updated_by)
WHERE NOT EXISTS (SELECT 1 FROM venue_statuses WHERE venue_statuses.name = v.name);

-- ============================================================================
-- CATEGORIES
-- Classification categories for activities
-- Values: 'event', 'release', 'awareness', 'conference', 'fyi', 'social media', 'speech', 'tv radio'
-- NOTE: pitch_required column replaced pitch_not_required in migration 0003
-- ============================================================================

INSERT INTO categories (id, name, display_name, sort_order, pitch_required, is_active, description, created_by, last_updated_by)
VALUES
  (1, 'event', 'Event', 1, true, true, 'Event category (may require pitch approval)', 1, 1),
  (2, 'release', 'Release', 2, true, true, 'Release category (may require pitch approval)', 1, 1),
  (3, 'awareness', 'Awareness date', 3, true, true, 'Awareness category', 1, 1),
  (4, 'conference', 'Conference', 4, true, true, 'Conference / AGM / Forum category', 1, 1),
  (5, 'fyi', 'FYI', 5, false, true, 'FYI category (use for internal awareness)', 1, 1),
  (6, 'social media', 'Social media', 6, true, true, 'Social media category', 1, 1),
  (7, 'speech', 'Speech', 7, true, true, 'Speech category', 1, 1),
  (8, 'tv radio', 'TV/Radio', 8, true, true, 'TV/Radio category', 1, 1)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- COMMS MATERIALS
-- Communication materials types
-- Common values: 'Media Advisory', 'Q&As', 'Key Messages', 'News Release', etc.
-- ============================================================================

INSERT INTO comms_materials (id, name, display_name, sort_order, is_active, description, created_by, last_updated_by)
VALUES
  (1, 'media advisory', 'Media Advisory', 1, true, 'Media advisory materials', 1, 1),
  (2, 'q and a', 'Q&As', 2, true, 'Question and answer materials', 1, 1),
  (3, 'key messages', 'Key Messages', 3, true, 'Key messaging materials', 1, 1),
  (4, 'news release', 'News Release', 4, true, 'News release materials', 1, 1),
  (5, 'backgrounder', 'Backgrounder', 5, true, 'Background information materials', 1, 1),
  (6, 'factsheet', 'Factsheet', 6, true, 'Fact sheet materials', 1, 1),
  (7, 'speaking notes', 'Speaking Notes', 7, true, 'Speaking notes materials', 1, 1)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- TRANSLATED LANGUAGES
-- Languages for translations
-- Common values: 'French', 'Chinese Simplified', 'Spanish', etc.
-- ============================================================================

INSERT INTO translated_languages (id, name, display_name, sort_order, is_active, description, created_by, last_updated_by)
VALUES
  (1, 'french', 'French', 1, true, 'French translation required', 1, 1),
  (2, 'chinese simplified', 'Chinese Simplified', 2, true, 'Simplified Chinese translation required', 1, 1),
  (3, 'chinese traditional', 'Chinese Traditional', 3, true, 'Traditional Chinese translation required', 1, 1),
  (4, 'spanish', 'Spanish', 4, true, 'Spanish translation required', 1, 1),
  (5, 'punjabi', 'Punjabi', 5, true, 'Punjabi translation required', 1, 1),
  (6, 'tagalog', 'Tagalog', 6, true, 'Tagalog translation required', 1, 1),
  (7, 'arabic', 'Arabic', 7, true, 'Arabic translation required', 1, 1),
  (8, 'hindi', 'Hindi', 8, true, 'Hindi translation required', 1, 1)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- CITIES
-- Cities for activities
-- ============================================================================

INSERT INTO cities (id, name, display_name, sort_order, is_active, province, created_by, last_updated_by) VALUES
  (1, 'Victoria', 'Victoria', 1, true, 'BC', 1, 1),
  (2, 'Vancouver', 'Vancouver', 2, true, 'BC', 1, 1),
  (3, 'Kelowna', 'Kelowna', 3, true, 'BC', 1, 1),
  (4, 'Nanaimo', 'Nanaimo', 4, true, 'BC', 1, 1),
  (5, 'Kamloops', 'Kamloops', 5, true, 'BC', 1, 1),
  (6, 'Prince George', 'Prince George', 6, true, 'BC', 1, 1),
  (7, 'Terrace', 'Terrace', 7, true, 'BC', 1, 1),
  (8, 'Vernon', 'Vernon', 8, true, 'BC', 1, 1),
  (9, 'Williams Lake', 'Williams Lake', 9, true, 'BC', 1, 1),
  (10, 'Prince Rupert', 'Prince Rupert', 10, true, 'BC', 1, 1),
  (11, 'Smithers', 'Smithers', 11, true, 'BC', 1, 1)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- MINISTRIES
-- Government departments
-- Uses UUID primary key, sort_order is required
-- MUST be seeded before government_representatives as they reference ministries
-- ============================================================================

INSERT INTO ministries (id, sort_order, is_active, display_name, abbreviation, created_by, last_updated_by) VALUES
  ('00000000-0000-4000-8000-000000000001', 1, true, 'Office of the Premier', 'PREM', 1, 1),
  ('00000000-0000-4000-8000-000000000002', 2, true, 'Agriculture and Food', 'AGRI', 1, 1),
  ('00000000-0000-4000-8000-000000000003', 3, true, 'Attorney General', 'AG', 1, 1),
  ('00000000-0000-4000-8000-000000000004', 4, true, 'Children and Family Development', 'CFD', 1, 1),
  ('00000000-0000-4000-8000-000000000005', 5, true, 'Citizens'' Services', 'CITZ', 1, 1),
  ('00000000-0000-4000-8000-000000000006', 6, true, 'Education and Child Care', 'EDUC', 1, 1),
  ('00000000-0000-4000-8000-000000000007', 7, true, 'Emergency Management and Climate Readiness', 'EMCR', 1, 1),
  ('00000000-0000-4000-8000-000000000008', 8, true, 'Energy and Climate Solutions', 'ENER', 1, 1),
  ('00000000-0000-4000-8000-000000000009', 9, true, 'Environment and Parks', 'ENV', 1, 1),
  ('00000000-0000-4000-8000-000000000010', 10, true, 'Finance', 'FIN', 1, 1),
  ('00000000-0000-4000-8000-000000000011', 11, true, 'Forests', 'FOR', 1, 1),
  ('00000000-0000-4000-8000-000000000012', 12, true, 'Health', 'HLTH', 1, 1),
  ('00000000-0000-4000-8000-000000000013', 13, true, 'Housing and Municipal Affairs', 'HOUS', 1, 1),
  ('00000000-0000-4000-8000-000000000014', 14, true, 'Indigenous Relations and Reconciliation', 'IRR', 1, 1),
  ('00000000-0000-4000-8000-000000000015', 15, true, 'Infrastructure', 'INFRA', 1, 1),
  ('00000000-0000-4000-8000-000000000016', 16, true, 'Intergovernmental Relations Secretariat', 'IGRS', 1, 1),
  ('00000000-0000-4000-8000-000000000017', 17, true, 'Jobs and Economic Growth', 'JEG', 1, 1),
  ('00000000-0000-4000-8000-000000000018', 18, true, 'Labour', 'LAB', 1, 1),
  ('00000000-0000-4000-8000-000000000019', 19, true, 'Mining and Critical Minerals', 'MIN', 1, 1),
  ('00000000-0000-4000-8000-000000000020', 20, true, 'Post-Secondary Education and Future Skills', 'PSFS', 1, 1),
  ('00000000-0000-4000-8000-000000000021', 21, true, 'Public Safety and Solicitor General', 'PSSG', 1, 1),
  ('00000000-0000-4000-8000-000000000022', 22, true, 'Social Development and Poverty Reduction', 'SDPR', 1, 1),
  ('00000000-0000-4000-8000-000000000023', 23, true, 'Tourism, Arts, Culture and Sport', 'TACS', 1, 1),
  ('00000000-0000-4000-8000-000000000024', 24, true, 'Transportation and Transit', 'TRAN', 1, 1),
  ('00000000-0000-4000-8000-000000000025', 25, true, 'Water, Land and Resource Stewardship', 'WLRS', 1, 1)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- GOVERNMENT REPRESENTATIVES
-- Representatives for activities
-- ============================================================================


-- PREMIER
INSERT INTO government_representatives (id, name, display_name, sort_order, is_active, title, ministry_id, representative_type, created_by, last_updated_by) VALUES
  (1000, 'David Eby', 'Premier David Eby', 1, true, 'Premier of British Columbia', '00000000-0000-4000-8000-000000000001', 'premier', 1, 1)
ON CONFLICT (id) DO UPDATE
  SET name = EXCLUDED.name,
      display_name = EXCLUDED.display_name,
      sort_order = EXCLUDED.sort_order,
      is_active = EXCLUDED.is_active,
      title = EXCLUDED.title,
      ministry_id = EXCLUDED.ministry_id,
      representative_type = EXCLUDED.representative_type,
      created_by = EXCLUDED.created_by,
      last_updated_by = EXCLUDED.last_updated_by;

-- MINISTERS
INSERT INTO government_representatives (id, name, display_name, sort_order, is_active, title, ministry_id, representative_type, created_by, last_updated_by) VALUES
  (2002, 'Lana Popham', 'Minister Lana Popham', 2, true, 'Minister of Agriculture and Food', '00000000-0000-4000-8000-000000000002', 'minister', 1, 1),
  (2003, 'Niki Sharma', 'Attorney General Niki Sharma', 3, true, 'Attorney General and Deputy Premier', '00000000-0000-4000-8000-000000000003', 'minister', 1, 1),
  (2004, 'Jodie Wickens', 'Minister Jodie Wickens', 4, true, 'Minister of Children and Family Development', '00000000-0000-4000-8000-000000000004', 'minister', 1, 1),
  (2005, 'Diana Gibson', 'Minister Diana Gibson', 5, true, 'Minister of Citizens'' Services', '00000000-0000-4000-8000-000000000005', 'minister', 1, 1),
  (2006, 'Lisa Beare', 'Minister Lisa Beare', 6, true, 'Minister of Education and Child Care', '00000000-0000-4000-8000-000000000006', 'minister', 1, 1),
  (2007, 'Kelly Greene', 'Minister Kelly Greene', 7, true, 'Minister of Emergency Management and Climate Readiness', '00000000-0000-4000-8000-000000000007', 'minister', 1, 1),
  (2008, 'Adrian Dix', 'Minister Adrian Dix', 8, true, 'Minister of Energy and Climate Solutions', '00000000-0000-4000-8000-000000000008', 'minister', 1, 1),
  (2009, 'Tamara Davidson', 'Minister Tamara Davidson', 9, true, 'Minister of Environment and Parks', '00000000-0000-4000-8000-000000000009', 'minister', 1, 1),
  (2010, 'Brenda Bailey', 'Minister Brenda Bailey', 10, true, 'Minister of Finance', '00000000-0000-4000-8000-000000000010', 'minister', 1, 1),
  (2011, 'Ravi Parmar', 'Minister Ravi Parmar', 11, true, 'Minister of Forests', '00000000-0000-4000-8000-000000000011', 'minister', 1, 1),
  (2012, 'Josie Osborne', 'Minister Josie Osborne', 12, true, 'Minister of Health', '00000000-0000-4000-8000-000000000012', 'minister', 1, 1),
  (2013, 'Christine Boyle', 'Minister Christine Boyle', 13, true, 'Minister of Housing and Municipal Affairs', '00000000-0000-4000-8000-000000000013', 'minister', 1, 1),
  (2014, 'Spencer Chandra Herbert', 'Minister Spencer Chandra Herbert', 14, true, 'Minister of Indigenous Relations and Reconciliation', '00000000-0000-4000-8000-000000000014', 'minister', 1, 1),
  (2015, 'Bowinn Ma', 'Minister Bowinn Ma', 15, true, 'Minister of Infrastructure', '00000000-0000-4000-8000-000000000015', 'minister', 1, 1),
  (2017, 'Ravi Kahlon', 'Minister Ravi Kahlon', 17, true, 'Minister of Jobs and Economic Growth', '00000000-0000-4000-8000-000000000017', 'minister', 1, 1),
  (2018, 'Jennifer Whiteside', 'Minister Jennifer Whiteside', 18, true, 'Minister of Labour', '00000000-0000-4000-8000-000000000018', 'minister', 1, 1),
  (2019, 'Jagrup Brar', 'Minister Jagrup Brar', 19, true, 'Minister of Mining and Critical Minerals', '00000000-0000-4000-8000-000000000019', 'minister', 1, 1),
  (2020, 'Jessie Sunner', 'Minister Jessie Sunner', 20, true, 'Minister of Post-Secondary Education and Future Skills', '00000000-0000-4000-8000-000000000020', 'minister', 1, 1),
  (2021, 'Nina Krieger', 'Minister Nina Krieger', 21, true, 'Minister of Public Safety and Solicitor General', '00000000-0000-4000-8000-000000000021', 'minister', 1, 1),
  (2022, 'Sheila Malcolmson', 'Minister Sheila Malcolmson', 22, true, 'Minister of Social Development and Poverty Reduction', '00000000-0000-4000-8000-000000000022', 'minister', 1, 1),
  (2023, 'Anne Kang', 'Minister Anne Kang', 23, true, 'Minister of Tourism, Arts, Culture and Sport', '00000000-0000-4000-8000-000000000023', 'minister', 1, 1),
  (2024, 'Mike Farnworth', 'Minister Mike Farnworth', 24, true, 'Minister of Transportation and Transit', '00000000-0000-4000-8000-000000000024', 'minister', 1, 1),
  (2025, 'Randene Neill', 'Minister Randene Neill', 25, true, 'Minister of Water, Land and Resource Stewardship', '00000000-0000-4000-8000-000000000025', 'minister', 1, 1)
ON CONFLICT (id) DO UPDATE
  SET name = EXCLUDED.name,
      display_name = EXCLUDED.display_name,
      sort_order = EXCLUDED.sort_order,
      is_active = EXCLUDED.is_active,
      title = EXCLUDED.title,
      ministry_id = EXCLUDED.ministry_id,
      representative_type = EXCLUDED.representative_type,
      created_by = EXCLUDED.created_by,
      last_updated_by = EXCLUDED.last_updated_by;


-- ============================================================================
-- TAGS
-- Classification tags for activities
-- Uses UUID primary key
-- ============================================================================

INSERT INTO tags (id, key, display_name, sort_order, is_active, created_by, last_updated_by) VALUES
  ('00000000-0000-4000-8000-000000000101', 'HQ-1P', 'HQ-1P', 1, true, 1, 1),
  ('00000000-0000-4000-8000-000000000102', 'HQ-3S', 'HQ-3S', 2, true, 1, 1),
  ('00000000-0000-4000-8000-000000000103', 'HQ-4W', 'HQ-4W', 3, true, 1, 1),
  ('00000000-0000-4000-8000-000000000104', 'HQ-PR', 'HQ-PR', 4, true, 1, 1),
  ('00000000-0000-4000-8000-000000000105', 'HQ-EV', 'HQ-EV', 5, true, 1, 1),
  ('00000000-0000-4000-8000-000000000106', 'HQ-ECO', 'HQ-ECO', 6, true, 1, 1),
  ('00000000-0000-4000-8000-000000000107', 'CAS', 'CAS', 7, true, 1, 1)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- ORGANIZATIONS
-- Organizations (superset of ministries)
-- Uses UUID primary key
-- Links to ministries where applicable (BC government ministries)
-- ============================================================================

INSERT INTO organizations (id, name, display_name, organization_type, ministry_id, is_active, sort_order, created_by, last_updated_by) VALUES
  ('00000000-0000-4000-8000-000000000001', 'Office of the Premier', 'Office of the Premier', 'bcgov', '00000000-0000-4000-8000-000000000001', true, 1, 1, 1),
  ('00000000-0000-4000-8000-000000000002', 'Agriculture and Food', 'Agriculture and Food', 'bcgov', '00000000-0000-4000-8000-000000000002', true, 2, 1, 1),
  ('00000000-0000-4000-8000-000000000003', 'Attorney General', 'Attorney General', 'bcgov', '00000000-0000-4000-8000-000000000003', true, 3, 1, 1),
  ('00000000-0000-4000-8000-000000000004', 'Children and Family Development', 'Children and Family Development', 'bcgov', '00000000-0000-4000-8000-000000000004', true, 4, 1, 1),
  ('00000000-0000-4000-8000-000000000005', 'Citizens'' Services', 'Citizens'' Services', 'bcgov', '00000000-0000-4000-8000-000000000005', true, 5, 1, 1),
  ('00000000-0000-4000-8000-000000000006', 'Education and Child Care', 'Education and Child Care', 'bcgov', '00000000-0000-4000-8000-000000000006', true, 6, 1, 1),
  ('00000000-0000-4000-8000-000000000007', 'Emergency Management and Climate Readiness', 'Emergency Management and Climate Readiness', 'bcgov', '00000000-0000-4000-8000-000000000007', true, 7, 1, 1),
  ('00000000-0000-4000-8000-000000000008', 'Energy and Climate Solutions', 'Energy and Climate Solutions', 'bcgov', '00000000-0000-4000-8000-000000000008', true, 8, 1, 1),
  ('00000000-0000-4000-8000-000000000009', 'Environment and Parks', 'Environment and Parks', 'bcgov', '00000000-0000-4000-8000-000000000009', true, 9, 1, 1),
  ('00000000-0000-4000-8000-000000000010', 'Finance', 'Finance', 'bcgov', '00000000-0000-4000-8000-000000000010', true, 10, 1, 1),
  ('00000000-0000-4000-8000-000000000011', 'Forests', 'Forests', 'bcgov', '00000000-0000-4000-8000-000000000011', true, 11, 1, 1),
  ('00000000-0000-4000-8000-000000000012', 'Health', 'Health', 'bcgov', '00000000-0000-4000-8000-000000000012', true, 12, 1, 1),
  ('00000000-0000-4000-8000-000000000013', 'Housing and Municipal Affairs', 'Housing and Municipal Affairs', 'bcgov', '00000000-0000-4000-8000-000000000013', true, 13, 1, 1),
  ('00000000-0000-4000-8000-000000000014', 'Indigenous Relations and Reconciliation', 'Indigenous Relations and Reconciliation', 'bcgov', '00000000-0000-4000-8000-000000000014', true, 14, 1, 1),
  ('00000000-0000-4000-8000-000000000015', 'Infrastructure', 'Infrastructure', 'bcgov', '00000000-0000-4000-8000-000000000015', true, 15, 1, 1),
  ('00000000-0000-4000-8000-000000000016', 'Intergovernmental Relations Secretariat', 'Intergovernmental Relations Secretariat', 'bcgov', '00000000-0000-4000-8000-000000000016', true, 16, 1, 1),
  ('00000000-0000-4000-8000-000000000017', 'Jobs and Economic Growth', 'Jobs and Economic Growth', 'bcgov', '00000000-0000-4000-8000-000000000017', true, 17, 1, 1),
  ('00000000-0000-4000-8000-000000000018', 'Labour', 'Labour', 'bcgov', '00000000-0000-4000-8000-000000000018', true, 18, 1, 1),
  ('00000000-0000-4000-8000-000000000019', 'Mining and Critical Minerals', 'Mining and Critical Minerals', 'bcgov', '00000000-0000-4000-8000-000000000019', true, 19, 1, 1),
  ('00000000-0000-4000-8000-000000000020', 'Post-Secondary Education and Future Skills', 'Post-Secondary Education and Future Skills', 'bcgov', '00000000-0000-4000-8000-000000000020', true, 20, 1, 1),
  ('00000000-0000-4000-8000-000000000021', 'Public Safety and Solicitor General', 'Public Safety and Solicitor General', 'bcgov', '00000000-0000-4000-8000-000000000021', true, 21, 1, 1),
  ('00000000-0000-4000-8000-000000000022', 'Social Development and Poverty Reduction', 'Social Development and Poverty Reduction', 'bcgov', '00000000-0000-4000-8000-000000000022', true, 22, 1, 1),
  ('00000000-0000-4000-8000-000000000023', 'Tourism, Arts, Culture and Sport', 'Tourism, Arts, Culture and Sport', 'bcgov', '00000000-0000-4000-8000-000000000023', true, 23, 1, 1),
  ('00000000-0000-4000-8000-000000000024', 'Transportation and Transit', 'Transportation and Transit', 'bcgov', '00000000-0000-4000-8000-000000000024', true, 24, 1, 1),
  ('00000000-0000-4000-8000-000000000025', 'Water, Land and Resource Stewardship', 'Water, Land and Resource Stewardship', 'bcgov', '00000000-0000-4000-8000-000000000025', true, 25, 1, 1)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- COMMUNICATION CONTACTS
-- Communication contacts for activities
-- ============================================================================

INSERT INTO communication_contacts (id, name, display_name, sort_order, is_active, email, phone, created_by, last_updated_by) VALUES
  (1, 'Sarah Johnson', 'Sarah Johnson', 1, true, 'sarah.johnson@gov.bc.ca', '250-555-0101', 1, 1),
  (2, 'Michael Chen', 'Michael Chen', 2, true, 'michael.chen@gov.bc.ca', '250-555-0102', 1, 1),
  (3, 'Emily Rodriguez', 'Emily Rodriguez', 3, true, 'emily.rodriguez@gov.bc.ca', '250-555-0103', 1, 1),
  (4, 'David Kim', 'David Kim', 4, true, 'david.kim@gov.bc.ca', '250-555-0104', 1, 1),
  (5, 'Jennifer Taylor', 'Jennifer Taylor', 5, true, 'jennifer.taylor@gov.bc.ca', '250-555-0105', 1, 1),
  (6, 'Robert Williams', 'Robert Williams', 6, true, 'robert.williams@gov.bc.ca', '250-555-0106', 1, 1)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- GRAPHICS USERS
-- Graphics users for activities
-- NOTE: Table was renamed from videographers to graphics_users in migration 0003
-- ============================================================================

INSERT INTO graphics_users (id, name, display_name, sort_order, is_active, email, phone, created_by, last_updated_by) VALUES
  (1, 'Mark Thompson', 'Mark Thompson', 1, true, 'mark.thompson@gov.bc.ca', '250-555-0301', 1, 1),
  (2, 'Nicole Garcia', 'Nicole Garcia', 2, true, 'nicole.garcia@gov.bc.ca', '250-555-0302', 1, 1),
  (3, 'Kevin Moore', 'Kevin Moore', 3, true, 'kevin.moore@gov.bc.ca', '250-555-0303', 1, 1),
  (4, 'Rachel Clark', 'Rachel Clark', 4, true, 'rachel.clark@gov.bc.ca', '250-555-0304', 1, 1),
  (5, 'Thomas Lewis', 'Thomas Lewis', 5, true, 'thomas.lewis@gov.bc.ca', '250-555-0305', 1, 1),
  (6, 'Michelle Walker', 'Michelle Walker', 6, true, 'michelle.walker@gov.bc.ca', '250-555-0306', 1, 1)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- VENUES
-- Venues for activities
-- ============================================================================

INSERT INTO venues (id, name, display_name, sort_order, is_active, address, created_by, last_updated_by) VALUES
  (1, 'Victoria Conference Centre', 'Victoria Conference Centre', 1, true, NULL, 1, 1),
  (2, 'Vancouver Convention Centre', 'Vancouver Convention Centre', 2, true, NULL, 1, 1),
  (3, 'Parliament Buildings', 'Parliament Buildings', 3, true, NULL, 1, 1),
  (4, 'Placeholder Venue 1', 'Placeholder Venue 1', 4, true, NULL, 1, 1),
  (5, 'Placeholder Venue 2', 'Placeholder Venue 2', 5, true, NULL, 1, 1),
  (6, 'Placeholder Venue 3', 'Placeholder Venue 3', 6, true, NULL, 1, 1)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- THEMES
-- Classification themes for activities
-- Uses UUID primary key
-- ============================================================================

INSERT INTO themes (id, key, name, display_name, sort_order, is_active, created_by, last_updated_by) VALUES
  ('00000000-0000-4000-8000-000000000201', 'health-care', 'health care', 'Health Care', 1, true, 1, 1),
  ('00000000-0000-4000-8000-000000000202', 'education', 'education', 'Education', 2, true, 1, 1),
  ('00000000-0000-4000-8000-000000000203', 'environment', 'environment', 'Environment', 3, true, 1, 1),
  ('00000000-0000-4000-8000-000000000204', 'infrastructure', 'infrastructure', 'Infrastructure', 4, true, 1, 1),
  ('00000000-0000-4000-8000-000000000205', 'economy', 'economy', 'Economy', 5, true, 1, 1),
  ('00000000-0000-4000-8000-000000000206', 'housing', 'housing', 'Housing', 6, true, 1, 1)
ON CONFLICT (id) DO NOTHING;

