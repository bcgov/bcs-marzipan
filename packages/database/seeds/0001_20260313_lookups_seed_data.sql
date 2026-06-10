-- Seed script for database lookups and reference data.
-- Run after schema migrations (see packages/database/migrations/) and after 0000_roles_seed (roles FK on users).
--
-- Serial sequences for explicit-id inserts are reset at end of pipeline:
-- packages/database/seeds/9999_20260423_sync_serial_sequences_seed.sql
--
-- IMPORTANT: Users must be seeded first as other tables reference them
-- via created_by and last_updated_by foreign keys

-- ============================================================================
-- USERS
-- Users for authentication and authorization
-- MUST be seeded first as other tables reference them via created_by/last_updated_by
-- 51 users total: 43 Editors, 5 Advanced, 2 Admin, 1 SystemAdmin
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
  -- Additional Editor role users (31 total) - role_id: 2
  (21, 'oliver.bennett', 'Oliver Bennett', 'oliver.bennett@gov.bc.ca', 'GCPE', 'Public Affairs Officer', 2, true),
  (22, 'maya.rivera', 'Maya Rivera', 'maya.rivera@gov.bc.ca', 'GCPE', 'Public Affairs Officer', 2, true),
  (23, 'liam.chen', 'Liam Chen', 'liam.chen@gov.bc.ca', 'GCPE', 'Public Affairs Officer', 2, true),
  (24, 'zoe.martinez', 'Zoe Martinez', 'zoe.martinez@gov.bc.ca', 'GCPE', 'Public Affairs Officer', 2, true),
  (25, 'ethan.nguyen', 'Ethan Nguyen', 'ethan.nguyen@gov.bc.ca', 'GCPE', 'Public Affairs Officer', 2, true),
  (26, 'ava.roberts', 'Ava Roberts', 'ava.roberts@gov.bc.ca', 'GCPE', 'Public Affairs Officer', 2, true),
  (27, 'noah.wilson', 'Noah Wilson', 'noah.wilson@gov.bc.ca', 'GCPE', 'Public Affairs Officer', 2, true),
  (28, 'isla.fernandez', 'Isla Fernandez', 'isla.fernandez@gov.bc.ca', 'GCPE', 'Public Affairs Officer', 2, true),
  (29, 'james.singh', 'James Singh', 'james.singh@gov.bc.ca', 'GCPE', 'Public Affairs Officer', 2, true),
  (30, 'mia.clark', 'Mia Clark', 'mia.clark@gov.bc.ca', 'GCPE', 'Public Affairs Officer', 2, true),
  (31, 'lucas.evans', 'Lucas Evans', 'lucas.evans@gov.bc.ca', 'GCPE', 'Public Affairs Officer', 2, true),
  (32, 'charlotte.morris', 'Charlotte Morris', 'charlotte.morris@gov.bc.ca', 'GCPE', 'Public Affairs Officer', 2, true),
  (33, 'henry.wright', 'Henry Wright', 'henry.wright@gov.bc.ca', 'GCPE', 'Public Affairs Officer', 2, true),
  (34, 'amelia.hughes', 'Amelia Hughes', 'amelia.hughes@gov.bc.ca', 'GCPE', 'Public Affairs Officer', 2, true),
  (35, 'benjamin.reed', 'Benjamin Reed', 'benjamin.reed@gov.bc.ca', 'GCPE', 'Public Affairs Officer', 2, true),
  (36, 'harper.ward', 'Harper Ward', 'harper.ward@gov.bc.ca', 'GCPE', 'Public Affairs Officer', 2, true),
  (37, 'jackson.cole', 'Jackson Cole', 'jackson.cole@gov.bc.ca', 'GCPE', 'Public Affairs Officer', 2, true),
  (38, 'ella.cooper', 'Ella Cooper', 'ella.cooper@gov.bc.ca', 'GCPE', 'Public Affairs Officer', 2, true),
  (39, 'sebastian.wood', 'Sebastian Wood', 'sebastian.wood@gov.bc.ca', 'GCPE', 'Public Affairs Officer', 2, true),
  (40, 'scarlett.ramirez', 'Scarlett Ramirez', 'scarlett.ramirez@gov.bc.ca', 'GCPE', 'Public Affairs Officer', 2, true),
  (41, 'logan.kelly', 'Logan Kelly', 'logan.kelly@gov.bc.ca', 'GCPE', 'Public Affairs Officer', 2, true),
  (42, 'grace.flores', 'Grace Flores', 'grace.flores@gov.bc.ca', 'GCPE', 'Public Affairs Officer', 2, true),
  (43, 'aiden.bailey', 'Aiden Bailey', 'aiden.bailey@gov.bc.ca', 'GCPE', 'Public Affairs Officer', 2, true),
  (44, 'chloe.brooks', 'Chloe Brooks', 'chloe.brooks@gov.bc.ca', 'GCPE', 'Public Affairs Officer', 2, true),
  (45, 'samuel.russell', 'Samuel Russell', 'samuel.russell@gov.bc.ca', 'GCPE', 'Public Affairs Officer', 2, true),
  (46, 'aria.henderson', 'Aria Henderson', 'aria.henderson@gov.bc.ca', 'GCPE', 'Public Affairs Officer', 2, true),
  (47, 'daniel.sanders', 'Daniel Sanders', 'daniel.sanders@gov.bc.ca', 'GCPE', 'Public Affairs Officer', 2, true),
  (48, 'victoria.price', 'Victoria Price', 'victoria.price@gov.bc.ca', 'GCPE', 'Public Affairs Officer', 2, true),
  (49, 'matthew.long', 'Matthew Long', 'matthew.long@gov.bc.ca', 'GCPE', 'Public Affairs Officer', 2, true),
  (50, 'lily.patterson', 'Lily Patterson', 'lily.patterson@gov.bc.ca', 'GCPE', 'Public Affairs Officer', 2, true),
  (51, 'owen.hughes', 'Owen Hughes', 'owen.hughes@gov.bc.ca', 'GCPE', 'Public Affairs Officer', 2, true),
  -- Advanced Editor role users (5 total) - role_id: 4
  (13, 'john.doe', 'John Doe', 'john.doe@gov.bc.ca', 'GCPE', 'Issues Manager', 4, true),
  (14, 'nadia.al-mansouri', 'Nadia Al-Mansouri', 'nadia.al-mansouri@gov.bc.ca', 'GCPE', 'Media Relations Officer', 4, true),
  (15, 'tendai.mbatha', 'Tendai Mbatha', 'tendai.mbatha@gov.bc.ca', 'GCPE', 'Digital Content Manager', 4, true),
  (16, 'linda.martin', 'Linda Martin', 'linda.martin@gov.bc.ca', 'GCPE', 'Events Manager', 4, true),
  (17, 'ahmed.rahman', 'Ahmed Rahman', 'ahmed.rahman@gov.bc.ca', 'GCPE', 'GCPE ADM', 4, true),
  -- Admin role users (2 total) - role_id: 5
  (18, 'thomas.garcia', 'Thomas Garcia', 'thomas.garcia@gov.bc.ca', 'GCPE', 'Corporate Calendar Manager', 5, true),
  (19, 'xiaoling.wang', 'Xiaoling Wang', 'xiaoling.wang@gov.bc.ca', 'GCPE', 'Corporate Calendar Manager', 5, true),
  -- System Admin role user (1 total) - role_id: 6
  (20, 'daniel.robinson', 'Daniel Robinson', 'daniel.robinson@gov.bc.ca', 'Business Communications Solutions', 'Business Communications Solutions', 6, true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- ACTIVITY STATUSES
-- Used for both activity entry status and field review statuses.
-- Canonical (id, name) mapping - code and activities seed depend on these ids:
--   1=new, 2=reviewed, 3=changed, 4=deleted, 5=delete_requested, 6=completed, 7=on_hold
-- ============================================================================

-- Upsert by id so we always enforce canonical (id, name) even when rows already exist (e.g. re-seed or prior migration).
INSERT INTO activity_statuses (id, name, display_name, sort_order, is_active, description, created_by, last_updated_by)
VALUES
  (1, 'new', 'New', 1, true, 'Newly created entry', 1, 1),
  (2, 'reviewed', 'Reviewed', 2, true, 'Entry has been reviewed', 1, 1),
  (3, 'changed', 'Changed', 3, true, 'Entry has been changed', 1, 1),
  (4, 'deleted', 'Deleted', 4, true, 'Entry is deleted', 1, 1),
  (5, 'delete_requested', 'Delete requested', 5, true, 'Delete has been requested by comms contact', 1, 1),
  (6, 'completed', 'Completed', 6, true, 'Activity has ended (set by scheduler)', 1, 1),
  (7, 'on_hold', 'On hold', 7, true, 'Activity is on hold (deferred)', 1, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  display_name = EXCLUDED.display_name,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  description = EXCLUDED.description,
  last_updated_by = EXCLUDED.last_updated_by,
  last_updated_date_time = now();

-- Safeguard: fail if (id, name) pairs are out of sync with the canonical mapping above.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM (VALUES
      (1, 'new'), (2, 'reviewed'), (3, 'changed'), (4, 'deleted'),
      (5, 'delete_requested'), (6, 'completed'), (7, 'on_hold')
    ) AS v(id, name)
    WHERE NOT EXISTS (
      SELECT 1 FROM activity_statuses a WHERE a.id = v.id AND a.name = v.name
    )
  ) THEN
    RAISE EXCEPTION 'activity_statuses seed alignment failed: expected (id,name) 1=new, 2=reviewed, 3=changed, 4=deleted, 5=delete_requested, 6=completed, 7=on_hold. Code and activities seed depend on these ids.';
  END IF;
END $$;

-- ============================================================================
-- PITCH STATUSES
-- Pitch approval statuses
-- Updated values: 'pending', 'required', 'not required'
-- ============================================================================

INSERT INTO pitch_statuses (name, display_name, sort_order, is_active, description, created_by, last_updated_by)
SELECT * FROM (VALUES
  ('pending', 'Pending', 1, true, 'Pitch approval is pending', 1, 1),
  ('required', 'Required', 2, true, 'Pitch approval is required', 1, 1),
  ('not required', 'Not required', 3, true, 'Pitch approval is not required', 1, 1)
) AS v(name, display_name, sort_order, is_active, description, created_by, last_updated_by)
WHERE NOT EXISTS (SELECT 1 FROM pitch_statuses WHERE pitch_statuses.name = v.name);

-- ============================================================================
-- DATE STATUSES
-- Date statuses for activities
-- Values: 'unknown', 'tentative', 'confirmed'
-- ============================================================================

INSERT INTO date_statuses (name, display_name, sort_order, is_active, description, created_by, last_updated_by)
SELECT * FROM (VALUES
  ('not_confirmed', 'Not confirmed', 1, true, 'Date is not confirmed', 1, 1),
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
  ('not_confirmed', 'Not confirmed', 1, true, 'Time is not confirmed', 1, 1),
  ('tentative', 'Tentative', 2, true, 'Time is tentatively scheduled', 1, 1),
  ('confirmed', 'Confirmed', 3, true, 'Time is confirmed', 1, 1)
) AS v(name, display_name, sort_order, is_active, description, created_by, last_updated_by)
WHERE NOT EXISTS (SELECT 1 FROM time_statuses WHERE time_statuses.name = v.name);

-- ============================================================================
-- VENUE STATUSES
-- Linked to activities.venue_status_id (TBC / TBD only).
-- ============================================================================

INSERT INTO venue_statuses (name, display_name, sort_order, is_active, description, created_by, last_updated_by)
SELECT * FROM (VALUES
  ('TBD', 'Venue TBD', 1, true, 'Venue to be determined', 1, 1),
  ('TBC', 'Venue TBC', 2, true, 'Venue to be confirmed', 1, 1)
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
  (3, 'not_required', 'Not required', 3, true, 1, 1)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- CATEGORIES
-- Classification categories for activities
-- Team-scoped categories (visibility = team) require team_categories (see teams seed).
-- ============================================================================

INSERT INTO categories (id, name, display_name, sort_order, visibility, is_active, description, created_by, last_updated_by)
VALUES
  (1, 'event', 'Event', 1, 'global', true, 'Event category', 1, 1),
  (2, 'release', 'Release', 2, 'global', true, 'Release category', 1, 1),
  (3, 'awareness', 'Awareness date', 3, 'global', true, 'Awareness category', 1, 1),
  (4, 'conference', 'Conference / AGM / Forum', 4, 'global', true, 'Conference / AGM / Forum category', 1, 1),
  (5, 'fyi', 'FYI', 5, 'global', true, 'FYI category (use for internal awareness)', 1, 1),
  (6, 'social media', 'Social media', 6, 'global', true, 'Social media category', 1, 1),
  (7, 'speech', 'Speech', 7, 'global', true, 'Speech category', 1, 1),
  (8, 'tv radio', 'TV/Radio', 8, 'global', true, 'TV/Radio category', 1, 1),
  (9, 'hq placeholder', 'HQ Placeholder', 9, 'team', true, 'HQ Placeholder category (CCHQ)', 1, 1),
  (10, 'igrs event', 'IGRS Event', 10, 'team', true, 'IGRS event category', 1, 1),
  (11, 'half-masting', 'Half-masting', 11, 'team', true, 'Half-masting category', 1, 1),
  (12, 'national day', 'National day', 12, 'team', true, 'National day category', 1, 1),
  (13, 'visit', 'Visit', 13, 'team', true, 'Visit category', 1, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  display_name = EXCLUDED.display_name,
  sort_order = EXCLUDED.sort_order,
  visibility = EXCLUDED.visibility,
  is_active = EXCLUDED.is_active,
  description = EXCLUDED.description,
  last_updated_by = EXCLUDED.last_updated_by,
  last_updated_date_time = now();

-- ============================================================================
-- COMMS MATERIALS
-- Communication materials types
-- Updated with new values
-- ============================================================================

INSERT INTO comms_materials (id, name, display_name, sort_order, is_active, description, created_by, last_updated_by)
VALUES
  (1, 'backgrounder', 'Backgrounder', 1, true, 'Background information materials', 1, 1),
  (2, 'digital content', 'Digital content', 2, true, 'Digital content materials', 1, 1),
  (3, 'event or media plan', 'Event or media plan', 3, true, 'Event or media planning materials', 1, 1),
  (4, 'factsheet', 'Factsheet', 4, true, 'Fact sheet materials', 1, 1),
  (5, 'information bulletin', 'Information bulletin', 5, true, 'Information bulletin materials', 1, 1),
  (6, 'issues note', 'Issues note', 6, true, 'Issues note materials', 1, 1),
  (7, 'itinerary', 'Itinerary', 7, true, 'Itinerary materials', 1, 1),
  (8, 'key messages', 'Key messages', 8, true, 'Key messaging materials', 1, 1),
  (9, 'media advisory', 'Media advisory', 9, true, 'Media advisory materials', 1, 1),
  (10, 'ministers message', 'Minister''s message', 10, true, 'Minister''s message materials', 1, 1),
  (11, 'news release', 'News release', 11, true, 'News release materials', 1, 1),
  (12, 'nycu news you can use', 'NYCU', 12, true, 'NYCU (News You Can Use) materials', 1, 1),
  (13, 'opinion editorial', 'Opinion editorial', 13, true, 'Opinion editorial materials', 1, 1),
  (14, 'press conference', 'Press conference', 14, true, 'Press conference materials', 1, 1),
  (15, 'q and a', 'Q&As', 15, true, 'Question and answer materials', 1, 1),
  (16, 'quote', 'Quote', 16, true, 'Quote materials', 1, 1),
  (17, 'report', 'Report', 17, true, 'Report materials', 1, 1),
  (18, 'speaking notes', 'Speaking notes', 18, true, 'Speaking notes materials', 1, 1),
  (19, 'statement', 'Statement', 19, true, 'Statement materials', 1, 1),
  (20, 'tech briefing', 'Tech briefing', 20, true, 'Technical briefing materials', 1, 1),
  (21, 'igrs biography', 'IGRS: Biography', 21, true, 'IGRS biography materials', 1, 1),
  (22, 'igrs briefing note', 'IGRS: Briefing note', 22, true, 'IGRS briefing note materials', 1, 1),
  (23, 'igrs gift', 'IGRS: Gift', 23, true, 'IGRS gift materials', 1, 1)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- TRANSLATED LANGUAGES
-- Languages for translations. shortcode values are internal language codes.
-- ============================================================================

INSERT INTO translated_languages (id, name, display_name, shortcode, sort_order, is_active, description, created_by, last_updated_by)
VALUES
  (1, 'arabic', 'Arabic', 'AR', 1, true, 'Arabic', 1, 1),
  (2, 'chinese simplified', 'Chinese (Simplified)', 'SC', 2, true, 'Chinese (Simplified)', 1, 1),
  (3, 'chinese traditional', 'Chinese (Traditional)', 'TC', 3, true, 'Chinese (Traditional)', 1, 1),
  (4, 'dutch', 'Dutch', 'DUT', 4, true, 'Dutch', 1, 1),
  (5, 'farsi', 'Farsi', 'FAR', 5, true, 'Farsi', 1, 1),
  (6, 'finnish', 'Finnish', 'FIN', 6, true, 'Finnish', 1, 1),
  (7, 'french', 'French', 'FR', 7, true, 'French', 1, 1),
  (8, 'gujarati', 'Gujarati', 'GUJ', 8, true, 'Gujarati', 1, 1),
  (9, 'hebrew', 'Hebrew', 'HE', 9, true, 'Hebrew', 1, 1),
  (10, 'hindi', 'Hindi', 'HI', 10, true, 'Hindi', 1, 1),
  (11, 'indonesian', 'Indonesian', 'IND', 11, true, 'Indonesian', 1, 1),
  (12, 'italian', 'Italian', 'IT', 12, true, 'Italian', 1, 1),
  (13, 'japanese', 'Japanese', 'JP', 13, true, 'Japanese', 1, 1),
  (14, 'korean', 'Korean', 'KO', 14, true, 'Korean', 1, 1),
  (15, 'portuguese', 'Portuguese', 'POR', 15, true, 'Portuguese', 1, 1),
  (16, 'punjabi', 'Punjabi', 'PUN', 16, true, 'Punjabi', 1, 1),
  (17, 'russian', 'Russian', 'RU', 17, true, 'Russian', 1, 1),
  (18, 'somali', 'Somali', 'SOM', 18, true, 'Somali', 1, 1),
  (19, 'spanish', 'Spanish', 'SPA', 19, true, 'Spanish', 1, 1),
  (20, 'swahili', 'Swahili', 'SWA', 20, true, 'Swahili', 1, 1),
  (21, 'tagalog', 'Tagalog', 'TL', 21, true, 'Tagalog', 1, 1),
  (22, 'ukrainian', 'Ukrainian', 'UKR', 22, true, 'Ukrainian', 1, 1),
  (23, 'urdu', 'Urdu', 'URD', 23, true, 'Urdu', 1, 1),
  (24, 'vietnamese', 'Vietnamese', 'VN', 24, true, 'Vietnamese', 1, 1)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- CITIES
-- Cities for activities
-- ============================================================================

INSERT INTO cities (id, name, display_name, sort_order, is_active, province_or_state, country, created_by, last_updated_by) VALUES
  (1, 'Victoria', 'Victoria', 1, true, 'BC', 'Canada', 1, 1),
  (2, 'Vancouver', 'Vancouver', 2, true, 'BC', 'Canada', 1, 1),
  (3, 'Kelowna', 'Kelowna', 3, true, 'BC', 'Canada', 1, 1),
  (4, 'Nanaimo', 'Nanaimo', 4, true, 'BC', 'Canada', 1, 1),
  (5, 'Kamloops', 'Kamloops', 5, true, 'BC', 'Canada', 1, 1),
  (6, 'Prince George', 'Prince George', 6, true, 'BC', 'Canada', 1, 1),
  (7, 'Terrace', 'Terrace', 7, true, 'BC', 'Canada', 1, 1),
  (8, 'Vernon', 'Vernon', 8, true, 'BC', 'Canada', 1, 1),
  (9, 'Williams Lake', 'Williams Lake', 9, true, 'BC', 'Canada', 1, 1),
  (10, 'Prince Rupert', 'Prince Rupert', 10, true, 'BC', 'Canada', 1, 1),
  (11, 'Smithers', 'Smithers', 11, true, 'BC', 'Canada', 1, 1),
  (12, 'Surrey', 'Surrey', 12, true, 'BC', 'Canada', 1, 1),
  (13, 'Burnaby', 'Burnaby', 13, true, 'BC', 'Canada', 1, 1),
  (14, 'Richmond', 'Richmond', 14, true, 'BC', 'Canada', 1, 1),
  (15, 'Abbotsford', 'Abbotsford', 15, true, 'BC', 'Canada', 1, 1),
  (16, 'Coquitlam', 'Coquitlam', 16, true, 'BC', 'Canada', 1, 1),
  (17, 'Delta', 'Delta', 17, true, 'BC', 'Canada', 1, 1),
  (18, 'Toronto', 'Toronto', 18, true, 'ON', 'Canada', 1, 1),
  (19, 'Ottawa', 'Ottawa', 19, true, 'ON', 'Canada', 1, 1),
  (20, 'Montreal', 'Montreal', 20, true, 'QC', 'Canada', 1, 1),
  (21, 'Calgary', 'Calgary', 21, true, 'AB', 'Canada', 1, 1),
  (22, 'Edmonton', 'Edmonton', 22, true, 'AB', 'Canada', 1, 1),
  (23, 'Winnipeg', 'Winnipeg', 23, true, 'MB', 'Canada', 1, 1),
  (24, 'Halifax', 'Halifax', 24, true, 'NS', 'Canada', 1, 1),
  (25, 'Quebec City', 'Quebec City', 25, true, 'QC', 'Canada', 1, 1)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- MINISTRIES
-- Government departments
-- Legacy: used UUID primary key. Now uses serial (integer) id.
-- MUST be seeded before government_representatives as they reference ministries
-- abbreviation: varchar(5), used in activity displayId prefix (with lead ministry)
-- ============================================================================

INSERT INTO ministries (id, sort_order, is_active, name, display_name, abbreviation, created_by, last_updated_by) VALUES
  (1, 1, true, 'PREM', 'Office of the Premier', 'PREM', 1, 1),
  (2, 2, true, 'AF', 'Agriculture and Food', 'AF', 1, 1),
  (3, 3, true, 'AG', 'Attorney General', 'AG', 1, 1),
  (4, 4, true, 'MCFD', 'Children and Family Development', 'MCFD', 1, 1),
  (5, 5, true, 'CITZ', 'Citizens'' Services', 'CITZ', 1, 1),
  (6, 6, true, 'ECC', 'Education and Child Care', 'ECC', 1, 1),
  (7, 7, true, 'EMCR', 'Emergency Management and Climate Readiness', 'EMCR', 1, 1),
  (8, 8, true, 'ECS', 'Energy and Climate Solutions', 'ECS', 1, 1),
  (9, 9, true, 'ENV', 'Environment and Parks', 'ENV', 1, 1),
  (10, 10, true, 'FIN', 'Finance', 'FIN', 1, 1),
  (11, 11, true, 'FOR', 'Forests', 'FOR', 1, 1),
  (12, 12, true, 'HLTH', 'Health', 'HLTH', 1, 1),
  (13, 13, true, 'HMA', 'Housing and Municipal Affairs', 'HMA', 1, 1),
  (14, 14, true, 'IRR', 'Indigenous Relations and Reconciliation', 'IRR', 1, 1),
  (15, 15, true, 'INF', 'Infrastructure', 'INF', 1, 1),
  (16, 16, true, 'IGRS', 'Intergovernmental Relations Secretariat', 'IGRS', 1, 1),
  (17, 17, true, 'JEG', 'Jobs and Economic Growth', 'JEG', 1, 1),
  (18, 18, true, 'LRB', 'Labour', 'LRB', 1, 1),
  (19, 19, true, 'MIN', 'Mining and Critical Minerals', 'MIN', 1, 1),
  (20, 20, true, 'PSFS', 'Post-Secondary Education and Future Skills', 'PSFS', 1, 1),
  (21, 21, true, 'PSSG', 'Public Safety and Solicitor General', 'PSSG', 1, 1),
  (22, 22, true, 'SDPR', 'Social Development and Poverty Reduction', 'SDPR', 1, 1),
  (23, 23, true, 'TACS', 'Tourism, Arts, Culture and Sport', 'TACS', 1, 1),
  (24, 24, true, 'MOTT', 'Transportation and Transit', 'MOTT', 1, 1),
  (25, 25, true, 'WLRS', 'Water, Land and Resource Stewardship', 'WLRS', 1, 1)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- ORGANIZATIONS
-- Organizations (superset of ministries)
-- Legacy: used UUID primary key. Now uses serial (integer) id.
-- Links to ministries where applicable (BC government ministries)
-- ============================================================================

INSERT INTO organizations (id, name, display_name, organization_type, ministry_id, is_active, sort_order, created_by, last_updated_by) VALUES
  (1, 'PREM', 'Office of the Premier', 'bcgov', 1, true, 1, 1, 1),
  (2, 'AF', 'Agriculture and Food', 'bcgov', 2, true, 2, 1, 1),
  (3, 'AG', 'Attorney General', 'bcgov', 3, true, 3, 1, 1),
  (4, 'MCFD', 'Children and Family Development', 'bcgov', 4, true, 4, 1, 1),
  (5, 'CITZ', 'Citizens'' Services', 'bcgov', 5, true, 5, 1, 1),
  (6, 'ECC', 'Education and Child Care', 'bcgov', 6, true, 6, 1, 1),
  (7, 'EMCR', 'Emergency Management and Climate Readiness', 'bcgov', 7, true, 7, 1, 1),
  (8, 'ECS', 'Energy and Climate Solutions', 'bcgov', 8, true, 8, 1, 1),
  (9, 'ENV', 'Environment and Parks', 'bcgov', 9, true, 9, 1, 1),
  (10, 'FIN', 'Finance', 'bcgov', 10, true, 10, 1, 1),
  (11, 'FOR', 'Forests', 'bcgov', 11, true, 11, 1, 1),
  (12, 'HLTH', 'Health', 'bcgov', 12, true, 12, 1, 1),
  (13, 'HMA', 'Housing and Municipal Affairs', 'bcgov', 13, true, 13, 1, 1),
  (14, 'IRR', 'Indigenous Relations and Reconciliation', 'bcgov', 14, true, 14, 1, 1),
  (15, 'INF', 'Infrastructure', 'bcgov', 15, true, 15, 1, 1),
  (16, 'IGRS', 'Intergovernmental Relations Secretariat', 'bcgov', 16, true, 16, 1, 1),
  (17, 'JEG', 'Jobs and Economic Growth', 'bcgov', 17, true, 17, 1, 1),
  (18, 'LRB', 'Labour', 'bcgov', 18, true, 18, 1, 1),
  (19, 'MIN', 'Mining and Critical Minerals', 'bcgov', 19, true, 19, 1, 1),
  (20, 'PSFS', 'Post-Secondary Education and Future Skills', 'bcgov', 20, true, 20, 1, 1),
  (21, 'PSSG', 'Public Safety and Solicitor General', 'bcgov', 21, true, 21, 1, 1),
  (22, 'SDPR', 'Social Development and Poverty Reduction', 'bcgov', 22, true, 22, 1, 1),
  (23, 'TACS', 'Tourism, Arts, Culture and Sport', 'bcgov', 23, true, 23, 1, 1),
  (24, 'MOTT', 'Transportation and Transit', 'bcgov', 24, true, 24, 1, 1),
  (25, 'WLRS', 'Water, Land and Resource Stewardship', 'bcgov', 25, true, 25, 1, 1)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- GOVERNMENT REPRESENTATIVES
-- Representatives for activities
-- ============================================================================

-- PREMIER (portfolio link is ministries.minister_government_rep_id, not on this row)
INSERT INTO government_representatives (id, name, display_name, sort_order, is_active, title, representative_type, created_by, last_updated_by) VALUES
  (1000, 'David Eby', 'Premier David Eby', 1, true, 'Premier of British Columbia', 'premier', 1, 1)
ON CONFLICT (id) DO UPDATE
  SET name = EXCLUDED.name,
      display_name = EXCLUDED.display_name,
      sort_order = EXCLUDED.sort_order,
      is_active = EXCLUDED.is_active,
      title = EXCLUDED.title,
      representative_type = EXCLUDED.representative_type,
      created_by = EXCLUDED.created_by,
      last_updated_by = EXCLUDED.last_updated_by;

-- MINISTERS
INSERT INTO government_representatives (id, name, display_name, sort_order, is_active, title, representative_type, created_by, last_updated_by) VALUES
  (2002, 'Lana Popham', 'Minister Lana Popham', 2, true, 'Minister of Agriculture and Food', 'minister', 1, 1),
  (2003, 'Niki Sharma', 'Attorney General Niki Sharma', 3, true, 'Attorney General and Deputy Premier', 'minister', 1, 1),
  (2004, 'Jodie Wickens', 'Minister Jodie Wickens', 4, true, 'Minister of Children and Family Development', 'minister', 1, 1),
  (2005, 'Diana Gibson', 'Minister Diana Gibson', 5, true, 'Minister of Citizens'' Services', 'minister', 1, 1),
  (2006, 'Lisa Beare', 'Minister Lisa Beare', 6, true, 'Minister of Education and Child Care', 'minister', 1, 1),
  (2007, 'Kelly Greene', 'Minister Kelly Greene', 7, true, 'Minister of Emergency Management and Climate Readiness', 'minister', 1, 1),
  (2008, 'Adrian Dix', 'Minister Adrian Dix', 8, true, 'Minister of Energy and Climate Solutions', 'minister', 1, 1),
  (2009, 'Tamara Davidson', 'Minister Tamara Davidson', 9, true, 'Minister of Environment and Parks', 'minister', 1, 1),
  (2010, 'Brenda Bailey', 'Minister Brenda Bailey', 10, true, 'Minister of Finance', 'minister', 1, 1),
  (2011, 'Ravi Parmar', 'Minister Ravi Parmar', 11, true, 'Minister of Forests', 'minister', 1, 1),
  (2012, 'Josie Osborne', 'Minister Josie Osborne', 12, true, 'Minister of Health', 'minister', 1, 1),
  (2013, 'Christine Boyle', 'Minister Christine Boyle', 13, true, 'Minister of Housing and Municipal Affairs', 'minister', 1, 1),
  (2014, 'Spencer Chandra Herbert', 'Minister Spencer Chandra Herbert', 14, true, 'Minister of Indigenous Relations and Reconciliation', 'minister', 1, 1),
  (2015, 'Bowinn Ma', 'Minister Bowinn Ma', 15, true, 'Minister of Infrastructure', 'minister', 1, 1),
  (2017, 'Ravi Kahlon', 'Minister Ravi Kahlon', 17, true, 'Minister of Jobs and Economic Growth', 'minister', 1, 1),
  (2018, 'Jennifer Whiteside', 'Minister Jennifer Whiteside', 18, true, 'Minister of Labour', 'minister', 1, 1),
  (2019, 'Jagrup Brar', 'Minister Jagrup Brar', 19, true, 'Minister of Mining and Critical Minerals', 'minister', 1, 1),
  (2020, 'Jessie Sunner', 'Minister Jessie Sunner', 20, true, 'Minister of Post-Secondary Education and Future Skills', 'minister', 1, 1),
  (2021, 'Nina Krieger', 'Minister Nina Krieger', 21, true, 'Minister of Public Safety and Solicitor General', 'minister', 1, 1),
  (2022, 'Sheila Malcolmson', 'Minister Sheila Malcolmson', 22, true, 'Minister of Social Development and Poverty Reduction', 'minister', 1, 1),
  (2023, 'Anne Kang', 'Minister Anne Kang', 23, true, 'Minister of Tourism, Arts, Culture and Sport', 'minister', 1, 1),
  (2024, 'Mike Farnworth', 'Minister Mike Farnworth', 24, true, 'Minister of Transportation and Transit', 'minister', 1, 1),
  (2025, 'Randene Neill', 'Minister Randene Neill', 25, true, 'Minister of Water, Land and Resource Stewardship', 'minister', 1, 1)
ON CONFLICT (id) DO UPDATE
  SET name = EXCLUDED.name,
      display_name = EXCLUDED.display_name,
      sort_order = EXCLUDED.sort_order,
      is_active = EXCLUDED.is_active,
      title = EXCLUDED.title,
      representative_type = EXCLUDED.representative_type,
      created_by = EXCLUDED.created_by,
      last_updated_by = EXCLUDED.last_updated_by;

-- Designated minister per ministry (source of truth on ministries row)
UPDATE ministries SET minister_government_rep_id = 1000 WHERE id = 1;
UPDATE ministries SET minister_government_rep_id = 2002 WHERE id = 2;
UPDATE ministries SET minister_government_rep_id = 2003 WHERE id = 3;
UPDATE ministries SET minister_government_rep_id = 2004 WHERE id = 4;
UPDATE ministries SET minister_government_rep_id = 2005 WHERE id = 5;
UPDATE ministries SET minister_government_rep_id = 2006 WHERE id = 6;
UPDATE ministries SET minister_government_rep_id = 2007 WHERE id = 7;
UPDATE ministries SET minister_government_rep_id = 2008 WHERE id = 8;
UPDATE ministries SET minister_government_rep_id = 2009 WHERE id = 9;
UPDATE ministries SET minister_government_rep_id = 2010 WHERE id = 10;
UPDATE ministries SET minister_government_rep_id = 2011 WHERE id = 11;
UPDATE ministries SET minister_government_rep_id = 2012 WHERE id = 12;
UPDATE ministries SET minister_government_rep_id = 2013 WHERE id = 13;
UPDATE ministries SET minister_government_rep_id = 2014 WHERE id = 14;
UPDATE ministries SET minister_government_rep_id = 2015 WHERE id = 15;
UPDATE ministries SET minister_government_rep_id = 2017 WHERE id = 17;
UPDATE ministries SET minister_government_rep_id = 2018 WHERE id = 18;
UPDATE ministries SET minister_government_rep_id = 2019 WHERE id = 19;
UPDATE ministries SET minister_government_rep_id = 2020 WHERE id = 20;
UPDATE ministries SET minister_government_rep_id = 2021 WHERE id = 21;
UPDATE ministries SET minister_government_rep_id = 2022 WHERE id = 22;
UPDATE ministries SET minister_government_rep_id = 2023 WHERE id = 23;
UPDATE ministries SET minister_government_rep_id = 2024 WHERE id = 24;
UPDATE ministries SET minister_government_rep_id = 2025 WHERE id = 25;

-- ============================================================================
-- TAGS
-- Tags teams can apply to activities; currently limited to use by admin
-- Updated with new values
-- ============================================================================

INSERT INTO tags (id, name, display_name, sort_order, visibility, is_active, description, created_by, last_updated_by) VALUES
  (1, 'HQ-EV', 'HQ-EV', 1, 'global', true, 'CCHQ tag for admin use only', 1, 1),
  (2, 'HQ-ECO', 'HQ-ECO', 2, 'global', true, 'CCHQ tag for admin use only', 1, 1),
  (3, 'HQ-PR', 'HQ-PR', 3, 'global', true, 'CCHQ tag for admin use only', 1, 1),
  (4, 'HQ-1P', 'HQ-1P', 4, 'global', true, 'CCHQ tag for admin use only', 1, 1),
  (5, 'HQ-2PT', 'HQ-2PT', 5, 'global', true, 'CCHQ tag for admin use only', 1, 1),
  (6, 'HQ-3S', 'HQ-3S', 6, 'global', true, 'CCHQ tag for admin use only', 1, 1),
  (7, 'HQ-4W', 'HQ-4W', 7, 'global', true, 'CCHQ tag for admin use only', 1, 1),
  (8, 'CAS', 'CAS', 8, 'global', true, 'CCHQ tag for admin use only', 1, 1),
  (9, 'LWS', 'LWS', 9, 'global', true, 'CCHQ tag for admin use only', 1, 1)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- THEMES
-- Classification themes for activities
-- Legacy: used UUID primary key. Now uses serial (integer) id.
-- ============================================================================

INSERT INTO themes (id, name, display_name, sort_order, is_active, created_by, last_updated_by) VALUES
  (1, 'birth', 'Birth', 1, true, 1, 1),
  (2, 'adoption', 'Adoption', 2, true, 1, 1),
  (3, 'death', 'Death', 3, true, 1, 1),
  (4, 'marriage and divorce', 'Marriage and Divorce', 4, true, 1, 1),
  (5, 'british columbians and our governments', 'British Columbians and Our Governments', 5, true, 1, 1),
  (6, 'driving and transportation', 'Driving and Transportation', 6, true, 1, 1),
  (7, 'education and training', 'Education and Training', 7, true, 1, 1),
  (8, 'employment business and economic development', 'Employment, Business and Economic Development', 8, true, 1, 1),
  (9, 'environmental protection and sustainability', 'Environmental Protection and Sustainability', 9, true, 1, 1),
  (10, 'family and social supports', 'Family and Social Supports', 10, true, 1, 1),
  (11, 'farming natural resources and industry', 'Farming, Natural Resources and Industry', 11, true, 1, 1),
  (12, 'health', 'Health', 12, true, 1, 1),
  (13, 'housing and tenancy', 'Housing and Tenancy', 13, true, 1, 1),
  (14, 'law crime and justice', 'Law, Crime and Justice', 14, true, 1, 1),
  (15, 'public safety and emergency services', 'Public Safety and Emergency Services', 15, true, 1, 1),
  (16, 'sports recreation arts and culture', 'Sports, Recreation, Arts and Culture', 16, true, 1, 1),
  (17, 'taxes and tax credits', 'Taxes and Tax Credits', 17, true, 1, 1),
  (18, 'tourism and immigration', 'Tourism and Immigration', 18, true, 1, 1)
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
  (2, 'ministry release', 'Ministry release', 2, true, 'News release originates from a ministry', 1, 1),
  (3, 'joint ministry 3rd party release', 'Joint ministry / 3rd party release', 3, true, 'Joint news release from ministry and third party', 1, 1),
  (4, 'joint ministry federal release', 'Joint ministry / Federal release', 4, true, 'Joint news release from ministry and federal government', 1, 1),
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
    '{"fields": ["startDate", "endDate", "startTime", "displayId", "isConfidential", "executiveSummary", "event_lead", "category", "isIssue", "newsReleaseOrigin", "lookAheadStatus", "lookAheadSection"], "printTemplate": "lookAheadV2", "sections": [{"id": "events", "name": "Events", "uiDisplayName": "Events", "reportDisplayName": "Events, speeches and releases (inside government)", "legendColor": "#A3C4E1", "order": 1, "filter": {"lookAheadSection": "events"}, "printPerDayColumnHeaderRepeat": true}, {"id": "issues", "name": "Issues", "uiDisplayName": "Issues", "reportDisplayName": "Issues and reports", "legendColor": "#ccc0d9", "order": 2, "filter": {"lookAheadSection": "issues"}}, {"id": "news", "name": "News", "uiDisplayName": "In the news", "reportDisplayName": "In the news (outside government)", "legendColor": "#e8f3a9", "order": 3, "filter": {"lookAheadSection": "news"}}, {"id": "awareness", "name": "Awareness", "uiDisplayName": "Awareness", "reportDisplayName": "Awareness dates", "legendColor": "#eaf1dd", "order": 4, "filter": {"lookAheadSection": "awareness"}, "printOmitReleaseColumn": true}, {"id": "longTerm", "name": "Long-term", "uiDisplayName": "Long-term", "reportDisplayName": "Long-term outlook", "legendColor": "#edf2f8", "order": 5, "filter": {"lookAheadSection": "longTerm"}, "printOmitReleaseColumn": true}]}'::jsonb,
    'Look Ahead report showing upcoming events and issues',
    1,
    1
  ),
  (
    2,
    'thirty-sixty-ninety',
    '30/60/90',
    3,
    true,
    'team',
    '{"fields": ["startDate", "endDate", "startTime", "displayId", "title", "isConfidential", "summary", "significance", "category", "isIssue", "strategy", "commsMaterials", "translationsRequired", "commsContact", "lastUpdatedDateTime"], "printTemplate": "thirtySixtyNinetyV2", "sections": []}'::jsonb,
    '30/60/90 day report showing activities grouped by calendar month',
    1,
    1
  ),
  (
    3,
    'exec',
    'Exec Look Ahead',
    2,
    true,
    'team',
    '{"fields": ["startDate", "endDate", "startTime", "displayId", "title", "isConfidential", "summary", "significance", "category", "isIssue", "newsReleaseOrigin", "lookAheadStatus", "lookAheadSection", "lastUpdatedDateTime"], "printTemplate": "lookAheadV2", "sections": [{"id": "events", "name": "Events", "uiDisplayName": "Events", "reportDisplayName": "Events, speeches and releases (inside government)", "legendColor": "#A3C4E1", "order": 1, "filter": {"lookAheadSection": "events"}, "printPerDayColumnHeaderRepeat": true}, {"id": "issues", "name": "Issues", "uiDisplayName": "Issues", "reportDisplayName": "Issues and reports", "legendColor": "#ccc0d9", "order": 2, "filter": {"lookAheadSection": "issues"}}, {"id": "news", "name": "News", "uiDisplayName": "In the news", "reportDisplayName": "In the news (outside government)", "legendColor": "#e8f3a9", "order": 3, "filter": {"lookAheadSection": "news"}}, {"id": "awareness", "name": "Awareness", "uiDisplayName": "Awareness", "reportDisplayName": "Awareness dates", "legendColor": "#eaf1dd", "order": 4, "filter": {"lookAheadSection": "awareness"}, "printOmitReleaseColumn": true}, {"id": "longTerm", "name": "Long-term", "uiDisplayName": "Long-term", "reportDisplayName": "Long-term outlook", "legendColor": "#edf2f8", "order": 5, "filter": {"lookAheadSection": "longTerm"}, "printOmitReleaseColumn": true}]}'::jsonb,
    'Executive look ahead report with the same section layout as Look Ahead',
    1,
    1
  ),
  (
    4,
    'planning',
    'Planning Report',
    4,
    true,
    'team',
    '{"fields": ["startDate", "endDate", "startTime", "displayId", "title", "isConfidential", "summary", "significance", "category", "isIssue", "schedulingNotes", "premierRequested", "lookAheadStatus", "lastUpdatedDateTime"], "printTemplate": "planningV2", "sections": [{"id": "schedule", "name": "GCPE Corporate Calendar: Activities Schedule", "reportDisplayName": "GCPE Corporate Calendar: Activities Schedule", "order": 1}]}'::jsonb,
    'Planning report for activities with strategy and scheduling context',
    1,
    1
  ),
  (
    5,
    'custom',
    'Custom',
    5,
    true,
    'team',
    '{"fields": ["startDate", "endDate", "startTime", "displayId", "title", "isConfidential", "executiveSummary", "summary", "category", "isIssue", "newsReleaseOrigin"], "printTemplate": "customV1", "sections": [{"id": "results", "name": "Results", "order": 1}]}'::jsonb,
    'Custom report: filter activities as needed',
    1,
    1
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- VENUE PRESETS
-- Admin-defined named venues for the activity form.
-- Pinned presets appear as quick-select badges beneath the Venue Name input.
-- First run only: WHERE NOT EXISTS skips inserting if any row exists (re-seed will not refresh presets).
-- ============================================================================

INSERT INTO venue_presets (venue_name, address_line1, city, province_or_state, country, sort_order, is_active, is_pinned, pinned_sort_order, created_by, last_updated_by)
SELECT * FROM (VALUES
  ('BC Legislature', '501 Belleville St', 'Victoria', 'British Columbia', 'Canada', 1, true, true, 1, 1, 1),
  ('Vancouver Convention Centre', '1055 Canada Pl', 'Vancouver', 'British Columbia', 'Canada', 2, true, true, 2, 1, 1),
  ('Government House', '1401 Rockland Ave', 'Victoria', 'British Columbia', 'Canada', 3, true, true, 3, 1, 1)
) AS v(venue_name, address_line1, city, province_or_state, country, sort_order, is_active, is_pinned, pinned_sort_order, created_by, last_updated_by)
WHERE NOT EXISTS (SELECT 1 FROM venue_presets LIMIT 1);
