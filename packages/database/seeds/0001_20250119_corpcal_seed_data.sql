-- Seed Script for Database
-- This script seeds all lookup tables and activities with sample data
-- Based on the current schema definitions
-- Run this after applying the base migration (0000_20250119_corpcal_base_schema.sql)
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
-- Renamed from keywords table. Uses serial primary key (not UUID).
-- NOTE: All tags have visibility='global' for now. Team visibility is a future feature flag.
-- ============================================================================

INSERT INTO tags (id, name, display_name, sort_order, visibility, is_active, description, created_by, last_updated_by) VALUES
  (1, 'HQ-1P', 'HQ-1P', 1, 'global', true, 'HQ-1P tag', 1, 1),
  (2, 'HQ-3S', 'HQ-3S', 2, 'global', true, 'HQ-3S tag', 1, 1),
  (3, 'HQ-4W', 'HQ-4W', 3, 'global', true, 'HQ-4W tag', 1, 1),
  (4, 'HQ-PR', 'HQ-PR', 4, 'global', true, 'HQ-PR tag', 1, 1),
  (5, 'HQ-EV', 'HQ-EV', 5, 'global', true, 'HQ-EV tag', 1, 1),
  (6, 'HQ-ECO', 'HQ-ECO', 6, 'global', true, 'HQ-ECO tag', 1, 1),
  (7, 'CAS', 'CAS', 7, 'global', true, 'CAS tag', 1, 1)
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
-- EVENT PLANNERS
-- Event planners for activities
-- ============================================================================

INSERT INTO event_planners (id, name, display_name, sort_order, is_active, email, phone, created_by, last_updated_by) VALUES
  (1, 'Alex Morgan', 'Alex Morgan', 1, true, 'alex.morgan@gov.bc.ca', '250-555-0201', 1, 1),
  (2, 'Jordan Taylor', 'Jordan Taylor', 2, true, 'jordan.taylor@gov.bc.ca', '250-555-0202', 1, 1),
  (3, 'Casey Lee', 'Casey Lee', 3, true, 'casey.lee@gov.bc.ca', '250-555-0203', 1, 1),
  (4, 'Riley Chen', 'Riley Chen', 4, true, 'riley.chen@gov.bc.ca', '250-555-0204', 1, 1)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- NEWS RELEASE ORIGINS
-- News release origins
-- ============================================================================

INSERT INTO news_release_origins (id, name, display_name, sort_order, is_active, description, created_by, last_updated_by) VALUES
  (1, 'ministry', 'Ministry', 1, true, 'News release originates from a ministry', 1, 1),
  (2, 'premier', 'Premier', 2, true, 'News release originates from the Premier', 1, 1),
  (3, 'joint', 'Joint Release', 3, true, 'Joint news release from multiple organizations', 1, 1),
  (4, 'external', 'External', 4, true, 'News release from external organization', 1, 1)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- NEWS RELEASE DISTRIBUTIONS
-- News release distribution types
-- ============================================================================

INSERT INTO news_release_distributions (id, name, display_name, sort_order, is_active, description, created_by, last_updated_by) VALUES
  (1, 'provincial', 'Provincial', 1, true, 'Provincial distribution', 1, 1),
  (2, 'regional', 'Regional', 2, true, 'Regional distribution', 1, 1),
  (3, 'local', 'Local', 3, true, 'Local distribution', 1, 1),
  (4, 'national', 'National', 4, true, 'National distribution', 1, 1)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- PREMIER REQUESTED
-- Premier request types
-- ============================================================================

INSERT INTO premier_requested (id, name, display_name, sort_order, is_active, description, created_by, last_updated_by) VALUES
  (1, 'attendance', 'Attendance Requested', 1, true, 'Premier attendance requested', 1, 1),
  (2, 'statement', 'Statement Requested', 2, true, 'Premier statement requested', 1, 1),
  (3, 'video', 'Video Message Requested', 3, true, 'Premier video message requested', 1, 1),
  (4, 'not requested', 'Not Requested', 4, true, 'No premier request', 1, 1)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SECTORS
-- Government sectors
-- Uses UUID primary key
-- ============================================================================

INSERT INTO sectors (id, name, display_name, sort_order, is_active, description, created_by, last_updated_by) VALUES
  ('00000000-0000-4000-8000-000000000301', 'health', 'Health', 1, true, 'Health sector', 1, 1),
  ('00000000-0000-4000-8000-000000000302', 'education', 'Education', 2, true, 'Education sector', 1, 1),
  ('00000000-0000-4000-8000-000000000303', 'environment', 'Environment', 3, true, 'Environment sector', 1, 1),
  ('00000000-0000-4000-8000-000000000304', 'infrastructure', 'Infrastructure', 4, true, 'Infrastructure sector', 1, 1),
  ('00000000-0000-4000-8000-000000000305', 'economy', 'Economy', 5, true, 'Economy sector', 1, 1),
  ('00000000-0000-4000-8000-000000000306', 'housing', 'Housing', 6, true, 'Housing sector', 1, 1)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- REPORTS
-- Report types and their configuration
-- ============================================================================

INSERT INTO reports (id, name, display_name, sort_order, is_active, visibility, config, description, created_by, last_updated_by) VALUES
  (
    1,
    'look-ahead',
    'Look Ahead',
    1,
    true,
    'team',
    '{"fields": ["startDate", "endDate", "startTime", "displayId", "title", "isConfidential", "executiveSummary", "summary", "category", "isIssue", "newsReleaseOrigin", "lookAheadStatus", "lookAheadSection"], "sections": [{"id": "events", "name": "Events", "order": 1, "filter": {"lookAheadSection": "events"}}, {"id": "issues", "name": "Issues", "order": 2, "filter": {"lookAheadSection": "issues"}}]}'::jsonb,
    'Look Ahead report showing upcoming events and issues',
    1,
    1
  ),
  (
    2,
    'thirty-sixty-ninety',
    '30/60/90',
    2,
    true,
    'team',
    '{"fields": ["startDate", "endDate", "startTime", "displayId", "title", "isConfidential", "summary", "category", "isIssue", "newsReleaseOrigin", "strategy", "commsContact", "lastUpdatedDateTime"], "globalFilter": {"dateRange": {"start": "2025-01-01", "end": "2025-06-30"}}, "sections": [{"id": "thirty", "name": "30 Days", "order": 1, "filter": {"dateRange": {"start": "2025-01-01", "end": "2025-01-31"}}}, {"id": "sixty", "name": "60 Days", "order": 2, "filter": {"dateRange": {"start": "2025-02-01", "end": "2025-03-02"}}}, {"id": "ninety", "name": "90 Days", "order": 3, "filter": {"dateRange": {"start": "2025-03-03", "end": "2025-06-30"}}}]}'::jsonb,
    '30/60/90 day report showing activities in upcoming 30, 60, and 90 day periods',
    1,
    1
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- TEAMS
-- Groups of system users for access control
-- ============================================================================

INSERT INTO teams (id, name, display_name, description, is_active, created_by, last_updated_by) VALUES
  (1, 'communications', 'Communications Team', 'Primary communications team', true, 1, 1),
  (2, 'policy', 'Policy Team', 'Policy and planning team', true, 1, 1),
  (3, 'media', 'Media Relations Team', 'Media relations and public affairs team', true, 1, 1)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- ACTIVITIES
-- Sample calendar activities with various statuses and configurations
-- ============================================================================

INSERT INTO activities (
  id,
  display_id,
  is_active,
  title,
  lead_org_id,
  lead_org_name,
  summary,
  significance,
  is_issue,
  is_all_day,
  start_date,
  end_date,
  date_status_id,
  start_time,
  end_time,
  time_status_id,
  scheduling_notes,
  strategy,
  news_release_origin_id,
  news_release_id,
  news_release_date_time,
  event_planner_lead_id,
  event_planner_lead_name,
  executive_summary,
  look_ahead_status,
  look_ahead_section,
  is_confidential,
  notes,
  pitch_date,
  news_release_distribution_id,
  premier_requested_id,
  visibility,
  comms_contact_lead_id,
  contact_ministry_id,
  activity_status_id,
  created_by,
  last_updated_by,
  created_date_time,
  last_updated_date_time,
  row_version,
  row_guid
) VALUES
  (
    1,
    'PREM-000001',
    true,
    'Premier''s Address on Climate Action',
    '00000000-0000-4000-8000-000000000001',
    NULL,
    'The Premier will deliver a keynote address on British Columbia''s climate action plan and renewable energy initiatives. The event will highlight new investments in clean technology and partnerships with First Nations communities.',
    'High-profile announcement expected to generate significant media coverage. Coordination with multiple ministries required.',
    false,
    false,
    '2025-03-15',
    '2025-03-15',
    3,
    '10:00:00',
    '12:00:00',
    3,
    'Event requires security clearance. Media will be present.',
    NULL,
    1,
    NULL,
    NULL,
    3,
    NULL,
    NULL,
    'new',
    'events',
    false,
    NULL,
    NULL,
    NULL,
    NULL,
    'global',
    4,
    '00000000-0000-4000-8000-000000000001',
    3,
    1,
    2,
    '2025-01-15 09:00:00-08',
    '2025-01-20 14:30:00-08',
    1,
    gen_random_uuid()
  ),
  (
    2,
    'HLTH-000002',
    true,
    'Health Care Facility Opening',
    '00000000-0000-4000-8000-000000000012',
    NULL,
    'Official opening ceremony for the new community health centre in Victoria. The Minister of Health will cut the ribbon and tour the facility.',
    'Important community milestone. Local media expected.',
    false,
    false,
    '2025-03-20',
    '2025-03-20',
    2,
    '14:00:00',
    '15:30:00',
    2,
    'Tentative timing pending confirmation from Minister''s office.',
    NULL,
    1,
    NULL,
    NULL,
    2,
    NULL,
    NULL,
    'new',
    'events',
    false,
    NULL,
    NULL,
    NULL,
    NULL,
    'global',
    4,
    '00000000-0000-4000-8000-000000000012',
    2,
    2,
    3,
    '2025-01-18 10:00:00-08',
    '2025-01-22 11:15:00-08',
    1,
    gen_random_uuid()
  ),
  (
    3,
    'EDUC-000003',
    true,
    'Education Summit 2025',
    '00000000-0000-4000-8000-000000000006',
    NULL,
    'Annual education summit bringing together educators, administrators, and policy makers to discuss innovations in K-12 education and early childhood development programs.',
    'Major policy announcement expected. Provincial significance.',
    false,
    true,
    '2025-04-01',
    '2025-04-01',
    1,
    NULL,
    NULL,
    1,
    'All-day event. Specific times to be confirmed.',
    NULL,
    1,
    NULL,
    NULL,
    3,
    NULL,
    NULL,
    'new',
    'events',
    true,
    NULL,
    NULL,
    NULL,
    NULL,
    'global',
    4,
    '00000000-0000-4000-8000-000000000006',
    1,
    3,
    4,
    '2025-01-10 08:00:00-08',
    '2025-01-25 16:45:00-08',
    1,
    gen_random_uuid()
  ),
  (
    4,
    'ENV-000004',
    true,
    'Forest Conservation Initiative Announcement',
    '00000000-0000-4000-8000-000000000009',
    NULL,
    'Announcement of new protected areas and forest conservation partnerships. Includes field visit to conservation site and media availability.',
    'Significant environmental policy announcement. National media interest expected.',
    false,
    false,
    '2025-03-25',
    '2025-03-25',
    3,
    '09:00:00',
    '16:00:00',
    3,
    'Confirmed schedule. Field trip component included.',
    NULL,
    1,
    NULL,
    NULL,
    4,
    NULL,
    NULL,
    'changed',
    'events',
    false,
    NULL,
    NULL,
    NULL,
    NULL,
    'global',
    4,
    '00000000-0000-4000-8000-000000000009',
    3,
    1,
    2,
    '2025-01-12 13:00:00-08',
    '2025-01-24 10:20:00-08',
    2,
    gen_random_uuid()
  ),
  (
    5,
    'HOUS-000005',
    true,
    'Affordable Housing Project Groundbreaking',
    '00000000-0000-4000-8000-000000000013',
    NULL,
    'Groundbreaking ceremony for new affordable housing development in Vancouver. Minister will speak and participate in ceremonial shovel turn.',
    'High-profile housing announcement. Part of provincial housing strategy rollout.',
    false,
    false,
    '2025-04-10',
    '2025-04-10',
    3,
    '11:00:00',
    '12:00:00',
    3,
    'Confirmed. Media scrum following announcement.',
    NULL,
    1,
    NULL,
    NULL,
    2,
    NULL,
    NULL,
    'new',
    'events',
    false,
    NULL,
    NULL,
    NULL,
    NULL,
    'global',
    4,
    '00000000-0000-4000-8000-000000000013',
    3,
    2,
    3,
    '2025-01-20 09:30:00-08',
    '2025-01-26 15:00:00-08',
    1,
    gen_random_uuid()
  )
ON CONFLICT (id) DO UPDATE
  SET display_id = EXCLUDED.display_id,
      is_active = EXCLUDED.is_active,
      title = EXCLUDED.title,
      lead_org_id = EXCLUDED.lead_org_id,
      lead_org_name = EXCLUDED.lead_org_name,
      summary = EXCLUDED.summary,
      significance = EXCLUDED.significance,
      is_issue = EXCLUDED.is_issue,
      is_all_day = EXCLUDED.is_all_day,
      start_date = EXCLUDED.start_date,
      end_date = EXCLUDED.end_date,
      date_status_id = EXCLUDED.date_status_id,
      start_time = EXCLUDED.start_time,
      end_time = EXCLUDED.end_time,
      time_status_id = EXCLUDED.time_status_id,
      scheduling_notes = EXCLUDED.scheduling_notes,
      strategy = EXCLUDED.strategy,
      news_release_origin_id = EXCLUDED.news_release_origin_id,
      news_release_id = EXCLUDED.news_release_id,
      news_release_date_time = EXCLUDED.news_release_date_time,
      event_planner_lead_id = EXCLUDED.event_planner_lead_id,
      event_planner_lead_name = EXCLUDED.event_planner_lead_name,
      executive_summary = EXCLUDED.executive_summary,
      look_ahead_status = EXCLUDED.look_ahead_status,
      look_ahead_section = EXCLUDED.look_ahead_section,
      is_confidential = EXCLUDED.is_confidential,
      notes = EXCLUDED.notes,
      pitch_date = EXCLUDED.pitch_date,
      news_release_distribution_id = EXCLUDED.news_release_distribution_id,
      premier_requested_id = EXCLUDED.premier_requested_id,
      visibility = EXCLUDED.visibility,
      comms_contact_lead_id = EXCLUDED.comms_contact_lead_id,
      contact_ministry_id = EXCLUDED.contact_ministry_id,
      activity_status_id = EXCLUDED.activity_status_id,
      created_by = EXCLUDED.created_by,
      last_updated_by = EXCLUDED.last_updated_by,
      created_date_time = EXCLUDED.created_date_time,
      last_updated_date_time = EXCLUDED.last_updated_date_time,
      row_version = EXCLUDED.row_version,
      row_guid = EXCLUDED.row_guid;

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
-- Link activities to tags (renamed from activityKeywords)
-- Tags now use serial ID (not UUID)
-- ============================================================================

INSERT INTO activity_tags (activity_id, tag_id, is_active, timestamp) VALUES
  (1, 4, true, now()),
  (2, 5, true, now()),
  (3, 4, true, now()),
  (4, 4, true, now()),
  (5, 5, true, now())
ON CONFLICT (activity_id, tag_id) DO UPDATE
  SET is_active = EXCLUDED.is_active,
      timestamp = now();

-- ============================================================================
-- ACTIVITY SUBSCRIPTIONS
-- Link activities to tags for subscriptions (renamed from activityTags)
-- Tags now use serial ID (not UUID)
-- ============================================================================

INSERT INTO activity_subscriptions (activity_id, tag_id, is_active, timestamp) VALUES
  (1, 1, true, now()),
  (2, 2, true, now()),
  (3, 3, true, now())
ON CONFLICT (activity_id, tag_id) DO UPDATE
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

INSERT INTO activity_representatives (activity_id, representative_id, representative_name, is_active, timestamp)
SELECT * FROM (VALUES
  (1, 1000, 'Premier David Eby', true, now()),
  (2, 2012, 'Minister Josie Osborne', true, now()),
  (3, 2006, 'Minister Lisa Beare', true, now()),
  (4, 2009, 'Minister Tamara Davidson', true, now()),
  (4, 2011, 'Minister Ravi Parmar', true, now()),
  (5, 2013, 'Minister Christine Boyle', true, now())
) AS v(activity_id, representative_id, representative_name, is_active, timestamp)
WHERE NOT EXISTS (
  SELECT 1 FROM activity_representatives 
  WHERE activity_representatives.activity_id = v.activity_id 
    AND activity_representatives.representative_id = v.representative_id
);

-- ============================================================================
-- ACTIVITY SHARED WITH TEAMS
-- Link activities to teams that can view them (renamed from activitySharedWithOrganizations)
-- ============================================================================

INSERT INTO activity_shared_with_teams (activity_id, team_id, is_active, timestamp) VALUES
  (1, 1, true, now()),
  (4, 1, true, now()),
  (4, 3, true, now())
ON CONFLICT (activity_id, team_id) DO UPDATE
  SET is_active = EXCLUDED.is_active,
      timestamp = now();

-- ============================================================================
-- ACTIVITY ADDITIONAL COMMS CONTACTS
-- Link activities to additional communication contacts
-- ============================================================================

INSERT INTO activity_additional_comms_contacts (activity_id, user_id, is_active, timestamp) VALUES
  (1, 2, true, now()),
  (4, 3, true, now())
ON CONFLICT (activity_id, user_id) DO UPDATE
  SET is_active = EXCLUDED.is_active,
      timestamp = now();

-- ============================================================================
-- ACTIVITY SECTORS
-- Link activities to sectors
-- ============================================================================

INSERT INTO activity_sectors (activity_id, sector_id, is_active, timestamp) VALUES
  (1, '00000000-0000-4000-8000-000000000303', true, now()),
  (2, '00000000-0000-4000-8000-000000000301', true, now()),
  (3, '00000000-0000-4000-8000-000000000302', true, now()),
  (4, '00000000-0000-4000-8000-000000000303', true, now()),
  (5, '00000000-0000-4000-8000-000000000306', true, now())
ON CONFLICT (activity_id, sector_id) DO UPDATE
  SET is_active = EXCLUDED.is_active,
      timestamp = now();

-- ============================================================================
-- ACTIVITY REPORT SETTINGS
-- Per-activity report settings (omitted flag for each report)
-- Must create entry for each activity/report combination
-- ============================================================================

INSERT INTO activity_report_settings (activity_id, report_id, omitted, timestamp) VALUES
  -- Activity 1 - Look Ahead and 30/60/90
  (1, 1, false, now()),
  (1, 2, false, now()),
  -- Activity 2 - Look Ahead and 30/60/90
  (2, 1, false, now()),
  (2, 2, false, now()),
  -- Activity 3 - Look Ahead and 30/60/90 (confidential, so will show as placeholder)
  (3, 1, false, now()),
  (3, 2, false, now()),
  -- Activity 4 - Look Ahead and 30/60/90
  (4, 1, false, now()),
  (4, 2, false, now()),
  -- Activity 5 - Look Ahead and 30/60/90
  (5, 1, false, now()),
  (5, 2, false, now())
ON CONFLICT (activity_id, report_id) DO UPDATE
  SET omitted = EXCLUDED.omitted,
      timestamp = now();

-- ============================================================================
-- UPDATE SEQUENCES
-- Reset sequences to prevent conflicts when inserting new records
-- This ensures that after seeding with explicit IDs, the sequences are
-- synchronized to the maximum ID value, preventing primary key conflicts
-- when new records are inserted via application code.
-- ============================================================================

-- Activity statuses sequence
SELECT setval('activity_statuses_id_seq', COALESCE((SELECT MAX(id) FROM activity_statuses), 1), true);

-- Pitch statuses sequence
SELECT setval('pitch_statuses_id_seq', COALESCE((SELECT MAX(id) FROM pitch_statuses), 1), true);

-- Date statuses sequence
SELECT setval('date_statuses_id_seq', COALESCE((SELECT MAX(id) FROM date_statuses), 1), true);

-- Time statuses sequence
SELECT setval('time_statuses_id_seq', COALESCE((SELECT MAX(id) FROM time_statuses), 1), true);

-- Venue statuses sequence
SELECT setval('venue_statuses_id_seq', COALESCE((SELECT MAX(id) FROM venue_statuses), 1), true);

-- System users sequence
SELECT setval('system_users_id_seq', COALESCE((SELECT MAX(id) FROM system_users), 1), true);

-- Categories sequence
SELECT setval('categories_id_seq', COALESCE((SELECT MAX(id) FROM categories), 1), true);

-- Comms materials sequence
SELECT setval('comms_materials_id_seq', COALESCE((SELECT MAX(id) FROM comms_materials), 1), true);

-- Translated languages sequence
SELECT setval('translated_languages_id_seq', COALESCE((SELECT MAX(id) FROM translated_languages), 1), true);

-- Cities sequence
SELECT setval('cities_id_seq', COALESCE((SELECT MAX(id) FROM cities), 1), true);

-- Government representatives sequence
SELECT setval('government_representatives_id_seq', COALESCE((SELECT MAX(id) FROM government_representatives), 1), true);

-- Tags sequence
SELECT setval('tags_id_seq', COALESCE((SELECT MAX(id) FROM tags), 1), true);

-- Communication contacts sequence
SELECT setval('communication_contacts_id_seq', COALESCE((SELECT MAX(id) FROM communication_contacts), 1), true);

-- Venues sequence
SELECT setval('venues_id_seq', COALESCE((SELECT MAX(id) FROM venues), 1), true);

-- Event planners sequence
SELECT setval('event_planners_id_seq', COALESCE((SELECT MAX(id) FROM event_planners), 1), true);

-- News release origins sequence
SELECT setval('news_release_origins_id_seq', COALESCE((SELECT MAX(id) FROM news_release_origins), 1), true);

-- News release distributions sequence
SELECT setval('news_release_distributions_id_seq', COALESCE((SELECT MAX(id) FROM news_release_distributions), 1), true);

-- Premier requested sequence
SELECT setval('premier_requested_id_seq', COALESCE((SELECT MAX(id) FROM premier_requested), 1), true);

-- Reports sequence
SELECT setval('reports_id_seq', COALESCE((SELECT MAX(id) FROM reports), 1), true);

-- Teams sequence
SELECT setval('teams_id_seq', COALESCE((SELECT MAX(id) FROM teams), 1), true);

-- Activities sequence
SELECT setval('activities_id_seq', COALESCE((SELECT MAX(id) FROM activities), 1), true);
