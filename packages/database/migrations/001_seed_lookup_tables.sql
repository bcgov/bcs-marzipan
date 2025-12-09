-- Seed Script for Lookup Tables
-- This script seeds all lookup tables with their initial values
-- Based on the current schema definitions in src/schema/lookups.ts
-- Run this after applying the base migration (0000_brown_the_executioner.sql)

-- ============================================================================
-- ACTIVITY STATUSES
-- Used for both activity entry status and field review statuses
-- Values: 'new', 'queued', 'reviewed', 'changed', 'paused', 'deleted'
-- ============================================================================

INSERT INTO activity_statuses (name, display_name, sort_order, is_active, description) VALUES
  ('new', 'New', 1, true, 'Newly created entry'),
  ('queued', 'Queued', 2, true, 'Entry is queued for review'),
  ('reviewed', 'Reviewed', 3, true, 'Entry has been reviewed'),
  ('changed', 'Changed', 4, true, 'Entry has been changed'),
  ('paused', 'Paused', 5, true, 'Entry is paused'),
  ('deleted', 'Deleted', 6, true, 'Entry is deleted')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- PITCH STATUSES
-- Pitch approval statuses
-- Values: 'not required', 'submitted', 'pitched', 'approved'
-- ============================================================================

INSERT INTO pitch_statuses (name, display_name, sort_order, is_active, description) VALUES
  ('not required', 'Not Required', 1, true, 'Pitch approval is not required'),
  ('submitted', 'Submitted', 2, true, 'Pitch has been submitted'),
  ('pitched', 'Pitched', 3, true, 'Pitch has been presented'),
  ('approved', 'Approved', 4, true, 'Pitch has been approved')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SCHEDULING STATUSES
-- Event scheduling statuses
-- Values: 'unknown', 'tentative', 'confirmed'
-- ============================================================================

INSERT INTO scheduling_statuses (name, display_name, sort_order, is_active, description) VALUES
  ('unknown', 'Unknown', 1, true, 'Scheduling status is unknown'),
  ('tentative', 'Tentative', 2, true, 'Event is tentatively scheduled'),
  ('confirmed', 'Confirmed', 3, true, 'Event is confirmed')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- CATEGORIES
-- Classification categories for activities
-- Values: 'event', 'release', 'awareness', 'conference', 'fyi', 'social media', 'speech', 'tv radio'
-- ============================================================================

INSERT INTO categories (name, display_name, sort_order, pitch_not_required, is_active, description) VALUES
  ('event', 'Event', 1, false, true, 'Event category (may require pitch approval)'),
  ('release', 'Release', 2, false, true, 'Release category (may require pitch approval)'),
  ('awareness', 'Awareness', 3, false, true, 'Awareness category'),
  ('conference', 'Conference', 4, false, true, 'Conference category'),
  ('fyi', 'FYI', 5, true, true, 'For Your Information category'),
  ('social media', 'Social Media', 6, false, true, 'Social Media category'),
  ('speech', 'Speech', 7, false, true, 'Speech category'),
  ('tv radio', 'TV/Radio', 8, false, true, 'TV/Radio category')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- COMMS MATERIALS
-- Communication materials types
-- Common values: 'Media Advisory', 'Q&As', 'Key Messages', 'News Release', etc.
-- ============================================================================

INSERT INTO comms_materials (name, display_name, sort_order, is_active, description) VALUES
  ('media advisory', 'Media Advisory', 1, true, 'Media advisory materials'),
  ('q and a', 'Q&As', 2, true, 'Question and answer materials'),
  ('key messages', 'Key Messages', 3, true, 'Key messaging materials'),
  ('news release', 'News Release', 4, true, 'News release materials'),
  ('backgrounder', 'Backgrounder', 5, true, 'Background information materials'),
  ('factsheet', 'Factsheet', 6, true, 'Fact sheet materials'),
  ('speaking notes', 'Speaking Notes', 7, true, 'Speaking notes materials')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- TRANSLATED LANGUAGES
-- Languages for translations
-- Common values: 'French', 'Chinese Simplified', 'Spanish', etc.
-- ============================================================================

INSERT INTO translated_languages (name, display_name, sort_order, is_active, description) VALUES
  ('french', 'French', 1, true, 'French translation required'),
  ('chinese simplified', 'Chinese Simplified', 2, true, 'Simplified Chinese translation required'),
  ('chinese traditional', 'Chinese Traditional', 3, true, 'Traditional Chinese translation required'),
  ('spanish', 'Spanish', 4, true, 'Spanish translation required'),
  ('punjabi', 'Punjabi', 5, true, 'Punjabi translation required'),
  ('tagalog', 'Tagalog', 6, true, 'Tagalog translation required'),
  ('arabic', 'Arabic', 7, true, 'Arabic translation required'),
  ('hindi', 'Hindi', 8, true, 'Hindi translation required')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- CITIES
-- Cities for activities
-- ============================================================================

INSERT INTO cities (id, name, display_name, sort_order, is_active, province) VALUES
  (1, 'Victoria', 'Victoria', 1, true, 'BC'),
  (2, 'Vancouver', 'Vancouver', 2, true, 'BC'),
  (3, 'Kelowna', 'Kelowna', 3, true, 'BC'),
  (4, 'Nanaimo', 'Nanaimo', 4, true, 'BC'),
  (5, 'Kamloops', 'Kamloops', 5, true, 'BC'),
  (6, 'Prince George', 'Prince George', 6, true, 'BC'),
  (7, 'Terrace', 'Terrace', 7, true, 'BC'),
  (8, 'Vernon', 'Vernon', 8, true, 'BC'),
  (9, 'Williams Lake', 'Williams Lake', 9, true, 'BC'),
  (10, 'Prince Rupert', 'Prince Rupert', 10, true, 'BC'),
  (11, 'Smithers', 'Smithers', 11, true, 'BC')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- GOVERNMENT REPRESENTATIVES
-- Representatives for activities
-- ============================================================================


-- PREMIER
INSERT INTO government_representatives (id, name, display_name, sort_order, is_active, title, ministry_id, representative_type) VALUES
  (1000, 'David Eby', 'Premier David Eby', 1, true, 'Premier of British Columbia', '00000000-0000-4000-8000-000000000001', 'premier')
ON CONFLICT (id) DO UPDATE
  SET name = EXCLUDED.name,
      display_name = EXCLUDED.display_name,
      sort_order = EXCLUDED.sort_order,
      is_active = EXCLUDED.is_active,
      title = EXCLUDED.title,
      ministry_id = EXCLUDED.ministry_id,
      representative_type = EXCLUDED.representative_type;

-- MINISTERS
INSERT INTO government_representatives (id, name, display_name, sort_order, is_active, title, ministry_id, representative_type) VALUES
  (2002, 'Lana Popham', 'Minister Lana Popham', 2, true, 'Minister of Agriculture and Food', '00000000-0000-4000-8000-000000000002', 'minister'),
  (2003, 'Niki Sharma', 'Attorney General Niki Sharma', 3, true, 'Attorney General and Deputy Premier', '00000000-0000-4000-8000-000000000003', 'minister'),
  (2004, 'Jodie Wickens', 'Minister Jodie Wickens', 4, true, 'Minister of Children and Family Development', '00000000-0000-4000-8000-000000000004', 'minister'),
  (2005, 'Diana Gibson', 'Minister Diana Gibson', 5, true, 'Minister of Citizens'' Services', '00000000-0000-4000-8000-000000000005', 'minister'),
  (2006, 'Lisa Beare', 'Minister Lisa Beare', 6, true, 'Minister of Education and Child Care', '00000000-0000-4000-8000-000000000006', 'minister'),
  (2007, 'Kelly Greene', 'Minister Kelly Greene', 7, true, 'Minister of Emergency Management and Climate Readiness', '00000000-0000-4000-8000-000000000007', 'minister'),
  (2008, 'Adrian Dix', 'Minister Adrian Dix', 8, true, 'Minister of Energy and Climate Solutions', '00000000-0000-4000-8000-000000000008', 'minister'),
  (2009, 'Tamara Davidson', 'Minister Tamara Davidson', 9, true, 'Minister of Environment and Parks', '00000000-0000-4000-8000-000000000009', 'minister'),
  (2010, 'Brenda Bailey', 'Minister Brenda Bailey', 10, true, 'Minister of Finance', '00000000-0000-4000-8000-000000000010', 'minister'),
  (2011, 'Ravi Parmar', 'Minister Ravi Parmar', 11, true, 'Minister of Forests', '00000000-0000-4000-8000-000000000011', 'minister'),
  (2012, 'Josie Osborne', 'Minister Josie Osborne', 12, true, 'Minister of Health', '00000000-0000-4000-8000-000000000012', 'minister'),
  (2013, 'Christine Boyle', 'Minister Christine Boyle', 13, true, 'Minister of Housing and Municipal Affairs', '00000000-0000-4000-8000-000000000013', 'minister'),
  (2014, 'Spencer Chandra Herbert', 'Minister Spencer Chandra Herbert', 14, true, 'Minister of Indigenous Relations and Reconciliation', '00000000-0000-4000-8000-000000000014', 'minister'),
  (2015, 'Bowinn Ma', 'Minister Bowinn Ma', 15, true, 'Minister of Infrastructure', '00000000-0000-4000-8000-000000000015', 'minister'),
  (2017, 'Ravi Kahlon', 'Minister Ravi Kahlon', 17, true, 'Minister of Jobs and Economic Growth', '00000000-0000-4000-8000-000000000017', 'minister'),
  (2018, 'Jennifer Whiteside', 'Minister Jennifer Whiteside', 18, true, 'Minister of Labour', '00000000-0000-4000-8000-000000000018', 'minister'),
  (2019, 'Jagrup Brar', 'Minister Jagrup Brar', 19, true, 'Minister of Mining and Critical Minerals', '00000000-0000-4000-8000-000000000019', 'minister'),
  (2020, 'Jessie Sunner', 'Minister Jessie Sunner', 20, true, 'Minister of Post-Secondary Education and Future Skills', '00000000-0000-4000-8000-000000000020', 'minister'),
  (2021, 'Nina Krieger', 'Minister Nina Krieger', 21, true, 'Minister of Public Safety and Solicitor General', '00000000-0000-4000-8000-000000000021', 'minister'),
  (2022, 'Sheila Malcolmson', 'Minister Sheila Malcolmson', 22, true, 'Minister of Social Development and Poverty Reduction', '00000000-0000-4000-8000-000000000022', 'minister'),
  (2023, 'Anne Kang', 'Minister Anne Kang', 23, true, 'Minister of Tourism, Arts, Culture and Sport', '00000000-0000-4000-8000-000000000023', 'minister'),
  (2024, 'Mike Farnworth', 'Minister Mike Farnworth', 24, true, 'Minister of Transportation and Transit', '00000000-0000-4000-8000-000000000024', 'minister'),
  (2025, 'Randene Neill', 'Minister Randene Neill', 25, true, 'Minister of Water, Land and Resource Stewardship', '00000000-0000-4000-8000-000000000025', 'minister')
ON CONFLICT (id) DO UPDATE
  SET name = EXCLUDED.name,
      display_name = EXCLUDED.display_name,
      sort_order = EXCLUDED.sort_order,
      is_active = EXCLUDED.is_active,
      title = EXCLUDED.title,
      ministry_id = EXCLUDED.ministry_id,
      representative_type = EXCLUDED.representative_type;


-- ============================================================================
-- TAGS
-- Classification tags for activities
-- Uses UUID primary key
-- ============================================================================

INSERT INTO tags (id, key, display_name, sort_order, is_active) VALUES
  ('00000000-0000-4000-8000-000000000101', 'HQ-1P', 'HQ-1P', 1, true),
  ('00000000-0000-4000-8000-000000000102', 'HQ-3S', 'HQ-3S', 2, true),
  ('00000000-0000-4000-8000-000000000103', 'HQ-4W', 'HQ-4W', 3, true),
  ('00000000-0000-4000-8000-000000000104', 'HQ-PR', 'HQ-PR', 4, true),
  ('00000000-0000-4000-8000-000000000105', 'HQ-EV', 'HQ-EV', 5, true),
  ('00000000-0000-4000-8000-000000000106', 'HQ-ECO', 'HQ-ECO', 6, true),
  ('00000000-0000-4000-8000-000000000107', 'CAS', 'CAS', 7, true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- MINISTRIES
-- Government departments
-- Uses UUID primary key, sort_order is required
-- ============================================================================

INSERT INTO ministries (id, sort_order, is_active, display_name) VALUES
  ('00000000-0000-4000-8000-000000000001', 1, true, 'Office of the Premier'),
  ('00000000-0000-4000-8000-000000000002', 2, true, 'Agriculture and Food'),
  ('00000000-0000-4000-8000-000000000003', 3, true, 'Attorney General'),
  ('00000000-0000-4000-8000-000000000004', 4, true, 'Children and Family Development'),
  ('00000000-0000-4000-8000-000000000005', 5, true, 'Citizens'' Services'),
  ('00000000-0000-4000-8000-000000000006', 6, true, 'Education and Child Care'),
  ('00000000-0000-4000-8000-000000000007', 7, true, 'Emergency Management and Climate Readiness'),
  ('00000000-0000-4000-8000-000000000008', 8, true, 'Energy and Climate Solutions'),
  ('00000000-0000-4000-8000-000000000009', 9, true, 'Environment and Parks'),
  ('00000000-0000-4000-8000-000000000010', 10, true, 'Finance'),
  ('00000000-0000-4000-8000-000000000011', 11, true, 'Forests'),
  ('00000000-0000-4000-8000-000000000012', 12, true, 'Health'),
  ('00000000-0000-4000-8000-000000000013', 13, true, 'Housing and Municipal Affairs'),
  ('00000000-0000-4000-8000-000000000014', 14, true, 'Indigenous Relations and Reconciliation'),
  ('00000000-0000-4000-8000-000000000015', 15, true, 'Infrastructure'),
  ('00000000-0000-4000-8000-000000000016', 16, true, 'Intergovernmental Relations Secretariat'),
  ('00000000-0000-4000-8000-000000000017', 17, true, 'Jobs and Economic Growth'),
  ('00000000-0000-4000-8000-000000000018', 18, true, 'Labour'),
  ('00000000-0000-4000-8000-000000000019', 19, true, 'Mining and Critical Minerals'),
  ('00000000-0000-4000-8000-000000000020', 20, true, 'Post-Secondary Education and Future Skills'),
  ('00000000-0000-4000-8000-000000000021', 21, true, 'Public Safety and Solicitor General'),
  ('00000000-0000-4000-8000-000000000022', 22, true, 'Social Development and Poverty Reduction'),
  ('00000000-0000-4000-8000-000000000023', 23, true, 'Tourism, Arts, Culture and Sport'),
  ('00000000-0000-4000-8000-000000000024', 24, true, 'Transportation and Transit'),
  ('00000000-0000-4000-8000-000000000025', 25, true, 'Water, Land and Resource Stewardship')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- ORGANIZATIONS
-- Organizations (superset of ministries)
-- Uses UUID primary key
-- Links to ministries where applicable (BC government ministries)
-- ============================================================================

INSERT INTO organizations (id, name, display_name, organization_type, ministry_id, is_active, sort_order) VALUES
  ('00000000-0000-4000-8000-000000000001', 'Office of the Premier', 'Office of the Premier', 'bcgov', '00000000-0000-4000-8000-000000000001', true, 1),
  ('00000000-0000-4000-8000-000000000002', 'Agriculture and Food', 'Agriculture and Food', 'bcgov', '00000000-0000-4000-8000-000000000002', true, 2),
  ('00000000-0000-4000-8000-000000000003', 'Attorney General', 'Attorney General', 'bcgov', '00000000-0000-4000-8000-000000000003', true, 3),
  ('00000000-0000-4000-8000-000000000004', 'Children and Family Development', 'Children and Family Development', 'bcgov', '00000000-0000-4000-8000-000000000004', true, 4),
  ('00000000-0000-4000-8000-000000000005', 'Citizens'' Services', 'Citizens'' Services', 'bcgov', '00000000-0000-4000-8000-000000000005', true, 5),
  ('00000000-0000-4000-8000-000000000006', 'Education and Child Care', 'Education and Child Care', 'bcgov', '00000000-0000-4000-8000-000000000006', true, 6),
  ('00000000-0000-4000-8000-000000000007', 'Emergency Management and Climate Readiness', 'Emergency Management and Climate Readiness', 'bcgov', '00000000-0000-4000-8000-000000000007', true, 7),
  ('00000000-0000-4000-8000-000000000008', 'Energy and Climate Solutions', 'Energy and Climate Solutions', 'bcgov', '00000000-0000-4000-8000-000000000008', true, 8),
  ('00000000-0000-4000-8000-000000000009', 'Environment and Parks', 'Environment and Parks', 'bcgov', '00000000-0000-4000-8000-000000000009', true, 9),
  ('00000000-0000-4000-8000-000000000010', 'Finance', 'Finance', 'bcgov', '00000000-0000-4000-8000-000000000010', true, 10),
  ('00000000-0000-4000-8000-000000000011', 'Forests', 'Forests', 'bcgov', '00000000-0000-4000-8000-000000000011', true, 11),
  ('00000000-0000-4000-8000-000000000012', 'Health', 'Health', 'bcgov', '00000000-0000-4000-8000-000000000012', true, 12),
  ('00000000-0000-4000-8000-000000000013', 'Housing and Municipal Affairs', 'Housing and Municipal Affairs', 'bcgov', '00000000-0000-4000-8000-000000000013', true, 13),
  ('00000000-0000-4000-8000-000000000014', 'Indigenous Relations and Reconciliation', 'Indigenous Relations and Reconciliation', 'bcgov', '00000000-0000-4000-8000-000000000014', true, 14),
  ('00000000-0000-4000-8000-000000000015', 'Infrastructure', 'Infrastructure', 'bcgov', '00000000-0000-4000-8000-000000000015', true, 15),
  ('00000000-0000-4000-8000-000000000016', 'Intergovernmental Relations Secretariat', 'Intergovernmental Relations Secretariat', 'bcgov', '00000000-0000-4000-8000-000000000016', true, 16),
  ('00000000-0000-4000-8000-000000000017', 'Jobs and Economic Growth', 'Jobs and Economic Growth', 'bcgov', '00000000-0000-4000-8000-000000000017', true, 17),
  ('00000000-0000-4000-8000-000000000018', 'Labour', 'Labour', 'bcgov', '00000000-0000-4000-8000-000000000018', true, 18),
  ('00000000-0000-4000-8000-000000000019', 'Mining and Critical Minerals', 'Mining and Critical Minerals', 'bcgov', '00000000-0000-4000-8000-000000000019', true, 19),
  ('00000000-0000-4000-8000-000000000020', 'Post-Secondary Education and Future Skills', 'Post-Secondary Education and Future Skills', 'bcgov', '00000000-0000-4000-8000-000000000020', true, 20),
  ('00000000-0000-4000-8000-000000000021', 'Public Safety and Solicitor General', 'Public Safety and Solicitor General', 'bcgov', '00000000-0000-4000-8000-000000000021', true, 21),
  ('00000000-0000-4000-8000-000000000022', 'Social Development and Poverty Reduction', 'Social Development and Poverty Reduction', 'bcgov', '00000000-0000-4000-8000-000000000022', true, 22),
  ('00000000-0000-4000-8000-000000000023', 'Tourism, Arts, Culture and Sport', 'Tourism, Arts, Culture and Sport', 'bcgov', '00000000-0000-4000-8000-000000000023', true, 23),
  ('00000000-0000-4000-8000-000000000024', 'Transportation and Transit', 'Transportation and Transit', 'bcgov', '00000000-0000-4000-8000-000000000024', true, 24),
  ('00000000-0000-4000-8000-000000000025', 'Water, Land and Resource Stewardship', 'Water, Land and Resource Stewardship', 'bcgov', '00000000-0000-4000-8000-000000000025', true, 25)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- COMMUNICATION CONTACTS
-- Communication contacts for activities
-- ============================================================================

INSERT INTO communication_contacts (id, name, display_name, sort_order, is_active, email, phone) VALUES
  (1, 'Sarah Johnson', 'Sarah Johnson', 1, true, 'sarah.johnson@gov.bc.ca', '250-555-0101'),
  (2, 'Michael Chen', 'Michael Chen', 2, true, 'michael.chen@gov.bc.ca', '250-555-0102'),
  (3, 'Emily Rodriguez', 'Emily Rodriguez', 3, true, 'emily.rodriguez@gov.bc.ca', '250-555-0103'),
  (4, 'David Kim', 'David Kim', 4, true, 'david.kim@gov.bc.ca', '250-555-0104'),
  (5, 'Jennifer Taylor', 'Jennifer Taylor', 5, true, 'jennifer.taylor@gov.bc.ca', '250-555-0105'),
  (6, 'Robert Williams', 'Robert Williams', 6, true, 'robert.williams@gov.bc.ca', '250-555-0106')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- EVENT PLANNERS
-- Event planners for activities
-- ============================================================================

INSERT INTO event_planners (id, name, display_name, sort_order, is_active, email, phone) VALUES
  (1, 'Lisa Anderson', 'Lisa Anderson', 1, true, 'lisa.anderson@gov.bc.ca', '250-555-0201'),
  (2, 'James Martinez', 'James Martinez', 2, true, 'james.martinez@gov.bc.ca', '250-555-0202'),
  (3, 'Patricia Brown', 'Patricia Brown', 3, true, 'patricia.brown@gov.bc.ca', '250-555-0203'),
  (4, 'Christopher Lee', 'Christopher Lee', 4, true, 'christopher.lee@gov.bc.ca', '250-555-0204'),
  (5, 'Amanda White', 'Amanda White', 5, true, 'amanda.white@gov.bc.ca', '250-555-0205'),
  (6, 'Daniel Harris', 'Daniel Harris', 6, true, 'daniel.harris@gov.bc.ca', '250-555-0206')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- VIDEOGRAPHERS
-- Videographers for activities
-- ============================================================================

INSERT INTO videographers (id, name, display_name, sort_order, is_active, email, phone) VALUES
  (1, 'Mark Thompson', 'Mark Thompson', 1, true, 'mark.thompson@gov.bc.ca', '250-555-0301'),
  (2, 'Nicole Garcia', 'Nicole Garcia', 2, true, 'nicole.garcia@gov.bc.ca', '250-555-0302'),
  (3, 'Kevin Moore', 'Kevin Moore', 3, true, 'kevin.moore@gov.bc.ca', '250-555-0303'),
  (4, 'Rachel Clark', 'Rachel Clark', 4, true, 'rachel.clark@gov.bc.ca', '250-555-0304'),
  (5, 'Thomas Lewis', 'Thomas Lewis', 5, true, 'thomas.lewis@gov.bc.ca', '250-555-0305'),
  (6, 'Michelle Walker', 'Michelle Walker', 6, true, 'michelle.walker@gov.bc.ca', '250-555-0306')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- THEMES
-- Classification themes for activities
-- Uses UUID primary key
-- ============================================================================

INSERT INTO themes (id, key, display_name, sort_order, is_active) VALUES
  ('00000000-0000-4000-8000-000000000201', 'health-care', 'Health Care', 1, true),
  ('00000000-0000-4000-8000-000000000202', 'education', 'Education', 2, true),
  ('00000000-0000-4000-8000-000000000203', 'environment', 'Environment', 3, true),
  ('00000000-0000-4000-8000-000000000204', 'infrastructure', 'Infrastructure', 4, true),
  ('00000000-0000-4000-8000-000000000205', 'economy', 'Economy', 5, true),
  ('00000000-0000-4000-8000-000000000206', 'housing', 'Housing', 6, true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SYSTEM USERS
-- System users for authentication and authorization
-- ============================================================================

INSERT INTO system_users (id, username, first_name, last_name, email, role, is_active, department) VALUES
  (1, 'john.doe', 'John', 'Doe', 'john.doe@gov.bc.ca', 'Admin', true, 'Office of the Premier'),
  (2, 'jane.smith', 'Jane', 'Smith', 'jane.smith@gov.bc.ca', 'Editor', true, 'Communications'),
  (3, 'sam.wilson', 'Sam', 'Wilson', 'sam.wilson@gov.bc.ca', 'Editor', true, 'Public Affairs'),
  (4, 'david.chen', 'David', 'Chen', 'david.chen@gov.bc.ca', 'Editor', true, 'Media Relations'),
  (5, 'emily.wang', 'Emily', 'Wang', 'emily.wang@gov.bc.ca', 'ReadOnly', true, 'Policy'),
  (6, 'michael.brown', 'Michael', 'Brown', 'michael.brown@gov.bc.ca', 'ReadOnly', true, 'Research')
ON CONFLICT (id) DO NOTHING;
