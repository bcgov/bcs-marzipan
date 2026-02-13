-- Seed Script for Database Lookups
-- This script seeds all lookup tables with reference data
-- Based on the current schema definitions
-- Run this after applying the base migration (0000_20250121_initial_tables.sql)
--
-- IMPORTANT: Users must be seeded first as other tables reference them
-- via created_by and last_updated_by foreign keys

-- ============================================================================
-- USERS
-- Users for authentication and authorization
-- MUST be seeded first as other tables reference them via created_by/last_updated_by
-- 20 users total: 12 Editors, 5 Advanced, 2 Admin, 1 SystemAdmin
-- ============================================================================

INSERT INTO users (id, ad_username, ad_display_name, ad_email, ad_department, ad_job_title, role_id, is_active) VALUES
  -- Editor role users (12 total) - role_id: 2
  (1, 'jane.smith', 'Jane Smith', 'jane.smith@gov.bc.ca', 'GCPE', 'Public Affairs Officer', 1, true),
  (2, 'wei.zhang', 'Wei Zhang', 'wei.zhang@gov.bc.ca', 'GCPE', 'Senior Public Affairs Officer', 2, true),
  (3, 'priya.patel', 'Priya Patel', 'priya.patel@gov.bc.ca', 'GCPE', 'Comms Manager', 2, true),
  (4, 'sarah.johnson', 'Sarah Johnson', 'sarah.johnson@gov.bc.ca', 'GCPE', 'Public Affairs Officer', 2, true),
  (5, 'yuki.tanaka', 'Yuki Tanaka', 'yuki.tanaka@gov.bc.ca', 'GCPE', 'Senior Public Affairs Officer', 2, true),
  (6, 'amara.okeke', 'Amara Okeke', 'amara.okeke@gov.bc.ca', 'GCPE', 'Comms Manager', 2, true),
  (7, 'robert.taylor', 'Robert Taylor', 'robert.taylor@gov.bc.ca', 'GCPE', 'Public Affairs Officer', 2, true),
  (8, 'fatima.hassan', 'Fatima Hassan', 'fatima.hassan@gov.bc.ca', 'GCPE', 'Senior Public Affairs Officer', 2, true),
  (9, 'ming.li', 'Ming Li', 'ming.li@gov.bc.ca', 'GCPE', 'Comms Manager', 2, true),
  (10, 'kwame.asante', 'Kwame Asante', 'kwame.asante@gov.bc.ca', 'GCPE', 'Public Affairs Officer', 2, true),
  (11, 'william.thomas', 'William Thomas', 'william.thomas@gov.bc.ca', 'GCPE', 'Senior Public Affairs Officer', 2, true),
  (12, 'soo-jin.kim', 'Soo-jin Kim', 'soo-jin.kim@gov.bc.ca', 'GCPE', 'Comms Manager', 2, true),
  -- Advanced role users (5 total) - role_id: 3
  (13, 'john.doe', 'John Doe', 'john.doe@gov.bc.ca', 'GCPE', 'Issues Manager', 3, true),
  (14, 'nadia.al-mansouri', 'Nadia Al-Mansouri', 'nadia.al-mansouri@gov.bc.ca', 'GCPE', 'Media Relations Officer', 3, true),
  (15, 'tendai.mbatha', 'Tendai Mbatha', 'tendai.mbatha@gov.bc.ca', 'GCPE', 'Digital Content Manager', 3, true),
  (16, 'linda.martin', 'Linda Martin', 'linda.martin@gov.bc.ca', 'GCPE', 'Events Manager', 3, true),
  (17, 'ahmed.rahman', 'Ahmed Rahman', 'ahmed.rahman@gov.bc.ca', 'GCPE', 'GCPE ADM', 3, true),
  -- Admin role users (2 total) - role_id: 4
  (18, 'thomas.garcia', 'Thomas Garcia', 'thomas.garcia@gov.bc.ca', 'GCPE', 'Corporate Calendar Manager', 4, true),
  (19, 'xiaoling.wang', 'Xiaoling Wang', 'xiaoling.wang@gov.bc.ca', 'GCPE', 'Corporate Calendar Manager', 4, true),
  -- SystemAdmin role user (1 total) - role_id: 5
  (20, 'daniel.robinson', 'Daniel Robinson', 'daniel.robinson@gov.bc.ca', 'Business Communications Solutions', 'Business Communications Solutions', 5, true)
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
-- Updated values: 'pending', 'required', 'not required'
-- ============================================================================

INSERT INTO pitch_statuses (name, display_name, sort_order, is_active, description, created_by, last_updated_by)
SELECT * FROM (VALUES
  ('pending', 'Pending', 1, true, 'Pitch approval is pending', 1, 1),
  ('required', 'Required', 2, true, 'Pitch approval is required', 1, 1),
  ('not required', 'Not Required', 3, true, 'Pitch approval is not required', 1, 1)
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
-- PITCH REQUIRED STATUSES (pending, required, not_required)
-- ============================================================================
INSERT INTO pitch_required_statuses (id, name, display_name, sort_order, is_active, created_by, last_updated_by)
VALUES
  (1, 'pending', 'Pending review', 1, true, 1, 1),
  (2, 'required', 'Required', 2, true, 1, 1),
  (3, 'not_required', 'Not Required', 3, true, 1, 1)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- TRANSLATION REQUIRED STATUSES (pending, required, not_required)
-- ============================================================================
INSERT INTO translation_required_statuses (id, name, display_name, sort_order, is_active, created_by, last_updated_by)
VALUES
  (1, 'pending', 'Pending review', 1, true, 1, 1),
  (2, 'required', 'Required', 2, true, 1, 1),
  (3, 'not_required', 'Not Required', 3, true, 1, 1)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- CATEGORIES
-- Classification categories for activities
-- Keep all existing values and add 'HQ Placeholder'
-- ============================================================================

INSERT INTO categories (id, name, display_name, sort_order, visibility, is_active, description, created_by, last_updated_by)
VALUES
  (1, 'event', 'Event', 1, 'global', true, 'Event category', 1, 1),
  (2, 'release', 'Release', 2, 'global', true, 'Release category', 1, 1),
  (3, 'awareness', 'Awareness date', 3, 'global', true, 'Awareness category', 1, 1),
  (4, 'conference', 'Conference', 4, 'global', true, 'Conference / AGM / Forum category', 1, 1),
  (5, 'fyi', 'FYI', 5, 'global', true, 'FYI category (use for internal awareness)', 1, 1),
  (6, 'social media', 'Social media', 6, 'global', true, 'Social media category', 1, 1),
  (7, 'speech', 'Speech', 7, 'global', true, 'Speech category', 1, 1),
  (8, 'tv radio', 'TV/Radio', 8, 'global', true, 'TV/Radio category', 1, 1),
  (9, 'hq placeholder', 'HQ Placeholder', 9, 'global', true, 'HQ Placeholder category', 1, 1)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- COMMS MATERIALS
-- Communication materials types
-- Updated with new values
-- ============================================================================

INSERT INTO comms_materials (id, name, display_name, sort_order, is_active, description, created_by, last_updated_by)
VALUES
  (1, 'backgrounder', 'Backgrounder', 1, true, 'Background information materials', 1, 1),
  (2, 'digital content', 'Digital Content', 2, true, 'Digital content materials', 1, 1),
  (3, 'event or media plan', 'Event or Media Plan', 3, true, 'Event or media planning materials', 1, 1),
  (4, 'factsheet', 'Factsheet', 4, true, 'Fact sheet materials', 1, 1),
  (5, 'information bulletin', 'Information Bulletin', 5, true, 'Information bulletin materials', 1, 1),
  (6, 'issues note', 'Issues Note', 6, true, 'Issues note materials', 1, 1),
  (7, 'itinerary', 'Itinerary', 7, true, 'Itinerary materials', 1, 1),
  (8, 'key messages', 'Key Messages', 8, true, 'Key messaging materials', 1, 1),
  (9, 'media advisory', 'Media Advisory', 9, true, 'Media advisory materials', 1, 1),
  (10, 'ministers message', 'Minister''s Message', 10, true, 'Minister''s message materials', 1, 1),
  (11, 'news release', 'News Release', 11, true, 'News release materials', 1, 1),
  (12, 'nycu news you can use', 'NYCU (News You Can Use)', 12, true, 'NYCU materials', 1, 1),
  (13, 'opinion editorial', 'Opinion Editorial', 13, true, 'Opinion editorial materials', 1, 1),
  (14, 'press conference', 'Press Conference', 14, true, 'Press conference materials', 1, 1),
  (15, 'q and a', 'Q&As', 15, true, 'Question and answer materials', 1, 1),
  (16, 'quote', 'Quote', 16, true, 'Quote materials', 1, 1),
  (17, 'report', 'Report', 17, true, 'Report materials', 1, 1),
  (18, 'speaking notes', 'Speaking Notes', 18, true, 'Speaking notes materials', 1, 1),
  (19, 'statement', 'Statement', 19, true, 'Statement materials', 1, 1),
  (20, 'tech briefing', 'Tech Briefing', 20, true, 'Technical briefing materials', 1, 1),
  (21, 'igrs biography', 'IGRS: Biography', 21, true, 'IGRS biography materials', 1, 1),
  (22, 'igrs briefing note', 'IGRS: Briefing Note', 22, true, 'IGRS briefing note materials', 1, 1),
  (23, 'igrs gift', 'IGRS: Gift', 23, true, 'IGRS gift materials', 1, 1)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- TRANSLATED LANGUAGES
-- Languages for translations. shortcode values are BCP 47 language tags.
-- Updated with new values
-- ============================================================================

INSERT INTO translated_languages (id, name, display_name, shortcode, sort_order, is_active, description, created_by, last_updated_by)
VALUES
  (1, 'arabic', 'Arabic', 'ar', 1, true, 'Arabic', 1, 1),
  (2, 'chinese simplified', 'Chinese (Simplified)', 'zh-Hans', 2, true, 'Simplified Chinese', 1, 1),
  (3, 'chinese traditional', 'Chinese (Traditional)', 'zh-Hant', 3, true, 'Traditional Chinese', 1, 1),
  (4, 'dutch', 'Dutch', 'nl', 4, true, 'Dutch', 1, 1),
  (5, 'farsi', 'Farsi', 'fa', 5, true, 'Farsi', 1, 1),
  (6, 'finnish', 'Finnish', 'fi', 6, true, 'Finnish', 1, 1),
  (7, 'french', 'French', 'fr', 7, true, 'French', 1, 1),
  (8, 'gujarati', 'Gujarati', 'gu', 8, true, 'Gujarati', 1, 1),
  (9, 'hebrew', 'Hebrew', 'he', 9, true, 'Hebrew', 1, 1),
  (10, 'hindi', 'Hindi', 'hi', 10, true, 'Hindi', 1, 1),
  (11, 'indonesian', 'Indonesian', 'id', 11, true, 'Indonesian', 1, 1),
  (12, 'japanese', 'Japanese', 'ja', 12, true, 'Japanese', 1, 1),
  (13, 'korean', 'Korean', 'ko', 13, true, 'Korean', 1, 1),
  (14, 'portuguese', 'Portuguese', 'pt', 14, true, 'Portuguese', 1, 1),
  (15, 'punjabi', 'Punjabi', 'pa', 15, true, 'Punjabi', 1, 1),
  (16, 'russian', 'Russian', 'ru', 16, true, 'Russian', 1, 1),
  (17, 'somali', 'Somali', 'so', 17, true, 'Somali', 1, 1),
  (18, 'spanish', 'Spanish', 'es', 18, true, 'Spanish', 1, 1),
  (19, 'swahili', 'Swahili', 'sw', 19, true, 'Swahili', 1, 1),
  (20, 'tagalog', 'Tagalog', 'tl', 20, true, 'Tagalog', 1, 1),
  (21, 'ukrainian', 'Ukrainian', 'uk', 21, true, 'Ukrainian', 1, 1),
  (22, 'urdu', 'Urdu', 'ur', 22, true, 'Urdu', 1, 1),
  (23, 'vietnamese', 'Vietnamese', 'vi', 23, true, 'Vietnamese', 1, 1)
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
-- Classification tags for activities (used for subscriptions/news subscribe)
-- Updated with new values
-- ============================================================================

INSERT INTO tags (id, name, display_name, sort_order, visibility, is_active, description, created_by, last_updated_by) VALUES
  (1, 'bc coroners service', 'BC Coroners Service', 1, 'global', true, 'BC Coroners Service subscription tag', 1, 1),
  (2, 'cleanbc', 'CleanBC', 2, 'global', true, 'CleanBC subscription tag', 1, 1),
  (3, 'connectivity in b c', 'Connectivity in B.C.', 3, 'global', true, 'Connectivity in B.C. subscription tag', 1, 1),
  (4, 'covid 19', 'COVID-19', 4, 'global', true, 'COVID-19 subscription tag', 1, 1),
  (5, 'ending gender based violence', 'Ending Gender-Based Violence', 5, 'global', true, 'Ending Gender-Based Violence subscription tag', 1, 1),
  (6, 'gender equity', 'Gender Equity', 6, 'global', true, 'Gender Equity subscription tag', 1, 1),
  (7, 'housing affordability', 'Housing Affordability', 7, 'global', true, 'Housing Affordability subscription tag', 1, 1),
  (8, 'natural resources', 'Natural Resources', 8, 'global', true, 'Natural Resources subscription tag', 1, 1),
  (9, 'tariffs', 'Tariffs', 9, 'global', true, 'Tariffs subscription tag', 1, 1)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- THEMES
-- Classification themes for activities
-- Uses UUID primary key
-- Updated with new values
-- ============================================================================

INSERT INTO themes (id, key, name, display_name, sort_order, is_active, created_by, last_updated_by) VALUES
  ('00000000-0000-4000-8000-000000000201', 'birth', 'birth', 'Birth', 1, true, 1, 1),
  ('00000000-0000-4000-8000-000000000202', 'adoption', 'adoption', 'Adoption', 2, true, 1, 1),
  ('00000000-0000-4000-8000-000000000203', 'death', 'death', 'Death', 3, true, 1, 1),
  ('00000000-0000-4000-8000-000000000204', 'marriage and divorce', 'marriage and divorce', 'Marriage and Divorce', 4, true, 1, 1),
  ('00000000-0000-4000-8000-000000000205', 'british columbians and our governments', 'british columbians and our governments', 'British Columbians and Our Governments', 5, true, 1, 1),
  ('00000000-0000-4000-8000-000000000206', 'driving and transportation', 'driving and transportation', 'Driving and Transportation', 6, true, 1, 1),
  ('00000000-0000-4000-8000-000000000207', 'education and training', 'education and training', 'Education and Training', 7, true, 1, 1),
  ('00000000-0000-4000-8000-000000000208', 'employment business and economic development', 'employment business and economic development', 'Employment, Business and Economic Development', 8, true, 1, 1),
  ('00000000-0000-4000-8000-000000000209', 'environmental protection and sustainability', 'environmental protection and sustainability', 'Environmental Protection and Sustainability', 9, true, 1, 1),
  ('00000000-0000-4000-8000-000000000210', 'family and social supports', 'family and social supports', 'Family and Social Supports', 10, true, 1, 1),
  ('00000000-0000-4000-8000-000000000211', 'farming natural resources and industry', 'farming natural resources and industry', 'Farming, Natural Resources and Industry', 11, true, 1, 1),
  ('00000000-0000-4000-8000-000000000212', 'health', 'health', 'Health', 12, true, 1, 1),
  ('00000000-0000-4000-8000-000000000213', 'housing and tenancy', 'housing and tenancy', 'Housing and Tenancy', 13, true, 1, 1),
  ('00000000-0000-4000-8000-000000000214', 'law crime and justice', 'law crime and justice', 'Law, Crime and Justice', 14, true, 1, 1),
  ('00000000-0000-4000-8000-000000000215', 'public safety and emergency services', 'public safety and emergency services', 'Public Safety and Emergency Services', 15, true, 1, 1),
  ('00000000-0000-4000-8000-000000000216', 'sports recreation arts and culture', 'sports recreation arts and culture', 'Sports, Recreation, Arts and Culture', 16, true, 1, 1),
  ('00000000-0000-4000-8000-000000000217', 'taxes and tax credits', 'taxes and tax credits', 'Taxes and Tax Credits', 17, true, 1, 1),
  ('00000000-0000-4000-8000-000000000218', 'tourism and immigration', 'tourism and immigration', 'Tourism and Immigration', 18, true, 1, 1)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- COMMS CONTACTS
-- Communication contacts for activities
-- ============================================================================

INSERT INTO comms_contacts (id, name, display_name, sort_order, is_active, email, phone, created_by, last_updated_by) VALUES
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
  (4, 'Riley Chen', 'Riley Chen', 4, true, 'riley.chen@gov.bc.ca', '250-555-0204', 1, 1),
  (5, 'Morgan Peters', 'Morgan Peters', 5, true, 'morgan.peters@gov.bc.ca', '250-555-0205', 1, 1),
  (6, 'Avery Kim', 'Avery Kim', 6, true, 'avery.kim@gov.bc.ca', '250-555-0206', 1, 1),
  (7, 'Dakota Smith', 'Dakota Smith', 7, true, 'dakota.smith@gov.bc.ca', '250-555-0207', 1, 1)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- NEWS RELEASE ORIGINS
-- News release origins
-- Updated with new values
-- ============================================================================

INSERT INTO news_release_origins (id, name, display_name, sort_order, is_active, description, created_by, last_updated_by) VALUES
  (1, 'tbd', 'TBD', 1, true, 'News release origin to be determined', 1, 1),
  (2, 'ministry gcpehq release', 'Ministry (GCPEHQ) release', 2, true, 'News release originates from a ministry (GCPEHQ)', 1, 1),
  (3, 'joint ministry gcpehq 3rd party release', 'Joint ministry (GCPEHQ) / 3rd party release', 3, true, 'Joint news release from ministry (GCPEHQ) and third party', 1, 1),
  (4, 'joint ministry gcpehq federal release', 'Joint ministry (GCPEHQ) / Federal release', 4, true, 'Joint news release from ministry (GCPEHQ) and federal government', 1, 1),
  (5, 'local government release', 'Local government release', 5, true, 'News release from local government', 1, 1),
  (6, '3rd party release', '3rd party release', 6, true, 'News release from third party organization', 1, 1),
  (7, 'federal release', 'Federal release', 7, true, 'News release from federal government', 1, 1)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- NEWS RELEASE DISTRIBUTIONS
-- News release distribution types
-- Updated with new values
-- ============================================================================

INSERT INTO news_release_distributions (id, name, display_name, sort_order, is_active, description, created_by, last_updated_by) VALUES
  (1, 'tbd', 'TBD', 1, true, 'Distribution to be determined', 1, 1),
  (2, 'provincewide', 'Provincewide', 2, true, 'Provincewide distribution', 1, 1),
  (3, 'regional', 'Regional', 3, true, 'Regional distribution', 1, 1),
  (4, 'web post only', 'Web post only', 4, true, 'Web post only distribution', 1, 1),
  (5, 'direct send only', 'Direct send only', 5, true, 'Direct send only distribution', 1, 1),
  (6, 'national', 'National', 6, true, 'National distribution', 1, 1),
  (7, 'other', 'Other', 7, true, 'Other distribution type', 1, 1)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- PREMIER REQUESTED
-- Premier request types
-- Updated with new values
-- ============================================================================

INSERT INTO premier_requested (id, name, display_name, sort_order, is_active, description, created_by, last_updated_by) VALUES
  (1, 'yes', 'Yes', 1, true, 'Premier requested', 1, 1),
  (2, 'no', 'No', 2, true, 'Premier not requested', 1, 1),
  (3, 'tbc', 'TBC', 3, true, 'Premier request to be confirmed', 1, 1),
  (4, 'confirmed', 'Confirmed', 4, true, 'Premier request confirmed', 1, 1),
  (5, 'not available', 'Not available', 5, true, 'Premier not available', 1, 1)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SECTORS
-- Government sectors
-- Uses UUID primary key
-- Updated with new values
-- ============================================================================

INSERT INTO sectors (id, name, display_name, sort_order, is_active, description, created_by, last_updated_by) VALUES
  ('00000000-0000-4000-8000-000000000301', 'agriculture', 'Agriculture', 1, true, 'Agriculture sector', 1, 1),
  ('00000000-0000-4000-8000-000000000302', 'cannabis', 'Cannabis', 2, true, 'Cannabis sector', 1, 1),
  ('00000000-0000-4000-8000-000000000303', 'clean technology', 'Clean Technology', 3, true, 'Clean Technology sector', 1, 1),
  ('00000000-0000-4000-8000-000000000304', 'construction', 'Construction', 4, true, 'Construction sector', 1, 1),
  ('00000000-0000-4000-8000-000000000305', 'film tv', 'Film & TV', 5, true, 'Film & TV sector', 1, 1),
  ('00000000-0000-4000-8000-000000000306', 'fisheries aquaculture', 'Fisheries & aquaculture', 6, true, 'Fisheries & aquaculture sector', 1, 1),
  ('00000000-0000-4000-8000-000000000307', 'forestry', 'Forestry', 7, true, 'Forestry sector', 1, 1),
  ('00000000-0000-4000-8000-000000000308', 'manufacturing', 'Manufacturing', 8, true, 'Manufacturing sector', 1, 1),
  ('00000000-0000-4000-8000-000000000309', 'mining', 'Mining', 9, true, 'Mining sector', 1, 1),
  ('00000000-0000-4000-8000-000000000310', 'technology innovation', 'Technology & innovation', 10, true, 'Technology & innovation sector', 1, 1),
  ('00000000-0000-4000-8000-000000000311', 'tourism', 'Tourism', 11, true, 'Tourism sector', 1, 1)
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
-- Groups of users for access control
-- Updated with new values
-- ============================================================================

INSERT INTO teams (id, name, display_name, description, is_active, created_by, last_updated_by) VALUES
  (1, 'af comms', 'AF Comms', 'Agriculture and Food Communications Team', true, 1, 1),
  (2, 'ag comms', 'AG Comms', 'Attorney General Communications Team', true, 1, 1),
  (3, 'cfd comms', 'CFD Comms', 'Children and Family Development Communications Team', true, 1, 1),
  (4, 'citz comms', 'CITZ Comms', 'Citizens'' Services Communications Team', true, 1, 1),
  (5, 'ecc comms', 'ECC Comms', 'Education and Child Care Communications Team', true, 1, 1),
  (6, 'emcr comms', 'EMCR Comms', 'Emergency Management and Climate Readiness Communications Team', true, 1, 1),
  (7, 'ecs comms', 'ECS Comms', 'Energy and Climate Solutions Communications Team', true, 1, 1),
  (8, 'env comms', 'ENV Comms', 'Environment and Parks Communications Team', true, 1, 1),
  (9, 'fin comms', 'FIN Comms', 'Finance Communications Team', true, 1, 1),
  (10, 'for comms', 'FOR Comms', 'Forests Communications Team', true, 1, 1),
  (11, 'hlth comms', 'HLTH Comms', 'Health Communications Team', true, 1, 1),
  (12, 'muni comms', 'MUNI Comms', 'Housing and Municipal Affairs Communications Team', true, 1, 1),
  (13, 'irr comms', 'IRR Comms', 'Indigenous Relations and Reconciliation Communications Team', true, 1, 1),
  (14, 'inf comms', 'INF Comms', 'Infrastructure Communications Team', true, 1, 1),
  (15, 'jedi comms', 'JEDI Comms', 'Jobs and Economic Growth Communications Team', true, 1, 1),
  (16, 'lab comms', 'LAB Comms', 'Labour Communications Team', true, 1, 1),
  (17, 'min comms', 'MIN Comms', 'Mining and Critical Minerals Communications Team', true, 1, 1),
  (18, 'psfs comms', 'PSFS Comms', 'Post-Secondary Education and Future Skills Communications Team', true, 1, 1),
  (19, 'pssg comms', 'PSSG Comms', 'Public Safety and Solicitor General Communications Team', true, 1, 1),
  (20, 'sdpr comms', 'SDPR Comms', 'Social Development and Poverty Reduction Communications Team', true, 1, 1),
  (21, 'tacs comms', 'TACS Comms', 'Tourism, Arts, Culture and Sport Communications Team', true, 1, 1),
  (22, 'moti comms', 'MOTI Comms', 'Transportation and Transit Communications Team', true, 1, 1),
  (23, 'wlrs comms', 'WLRS Comms', 'Water, Land and Resource Stewardship Communications Team', true, 1, 1),
  (24, 'calendar admin', 'Calendar Admin', 'Calendar Administration Team', true, 1, 1),
  (25, 'gcpe executive', 'GCPE Executive', 'GCPE Executive Team', true, 1, 1),
  (26, 'issues management', 'Issues Management', 'Issues Management Team', true, 1, 1),
  (27, 'editorial', 'Editorial', 'Editorial Team', true, 1, 1),
  (28, 'media relations', 'Media Relations', 'Media Relations Team', true, 1, 1),
  (29, 'events', 'Events', 'Events Team', true, 1, 1),
  (30, 'digital comms', 'Digital Comms', 'Digital Communications Team', true, 1, 1)
ON CONFLICT (id) DO NOTHING;

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

-- Users sequence
SELECT setval('users_id_seq', COALESCE((SELECT MAX(id) FROM users), 1), true);

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

-- Comms contacts sequence
SELECT setval('comms_contacts_id_seq', COALESCE((SELECT MAX(id) FROM comms_contacts), 1), true);

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

-- ============================================================================
-- VENUE QUICK PICKS
-- Admin-configured quick-pick venues for the activity form (max 4 active)
-- ============================================================================

INSERT INTO venue_quick_picks (venue_name, street, city, province_or_state, country, sort_order, is_active, created_by, last_updated_by)
SELECT * FROM (VALUES
  ('BC Legislature', '501 Belleville St', 'Victoria', 'British Columbia', 'Canada', 1, true, 1, 1),
  ('Vancouver Convention Centre', '1055 Canada Pl', 'Vancouver', 'British Columbia', 'Canada', 2, true, 1, 1)
) AS v(venue_name, street, city, province_or_state, country, sort_order, is_active, created_by, last_updated_by)
WHERE NOT EXISTS (SELECT 1 FROM venue_quick_picks LIMIT 1);

-- Venue quick picks sequence
SELECT setval('venue_quick_picks_id_seq', COALESCE((SELECT MAX(id) FROM venue_quick_picks), 1), true);
