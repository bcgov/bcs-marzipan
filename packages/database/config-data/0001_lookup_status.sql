-- Seed script for database lookups and reference data.
-- Run after schema migrations (see packages/database/migrations/) and after 0000_roles_seed (roles FK on users).
--
-- Serial sequences for explicit-id inserts are reset at end of pipeline:
-- packages/database/seeds/9999_20260423_sync_serial_sequences_seed.sql (fixture seed directory)

-- ============================================================================
-- ACTIVITY STATUSES
-- Used for both activity entry status and field review statuses.
-- Canonical (id, name) mapping - code and activities seed depend on these ids:
--   1=new, 2=reviewed, 3=changed, 4=deleted, 5=delete_requested, 6=completed, 7=on_hold
-- ============================================================================

-- Upsert by id so we always enforce canonical (id, name) even when rows already exist (e.g. re-seed or prior migration).
INSERT INTO activity_statuses (id, name, display_name, sort_order, is_active, description, created_by, last_updated_by)
VALUES
  (1, 'new', 'New', 1, true, 'Newly created entry', 999, 999),
  (2, 'reviewed', 'Reviewed', 2, true, 'Entry has been reviewed', 999, 999),
  (3, 'changed', 'Changed', 3, true, 'Entry has been changed', 999, 999),
  (4, 'deleted', 'Deleted', 4, true, 'Entry is deleted', 999, 999),
  (5, 'delete_requested', 'Delete requested', 5, true, 'Delete has been requested by comms contact', 999, 999),
  (6, 'completed', 'Completed', 6, true, 'Activity has ended (set by scheduler)', 999, 999),
  (7, 'on_hold', 'On hold', 7, true, 'Activity is on hold (deferred)', 999, 999)
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
  ('pending', 'Pending', 1, true, 'Pitch approval is pending', 999, 999),
  ('required', 'Required', 2, true, 'Pitch approval is required', 999, 999),
  ('not required', 'Not required', 3, true, 'Pitch approval is not required', 999, 999)
) AS v(name, display_name, sort_order, is_active, description, created_by, last_updated_by)
WHERE NOT EXISTS (SELECT 1 FROM pitch_statuses WHERE pitch_statuses.name = v.name);

-- ============================================================================
-- DATE STATUSES
-- Date statuses for activities
-- Values: 'unknown', 'tentative', 'confirmed'
-- ============================================================================

INSERT INTO date_statuses (name, display_name, sort_order, is_active, description, created_by, last_updated_by)
SELECT * FROM (VALUES
  ('not_confirmed', 'Not confirmed', 1, true, 'Date is not confirmed', 999, 999),
  ('tentative', 'Tentative', 2, true, 'Date is tentatively scheduled', 999, 999),
  ('confirmed', 'Confirmed', 3, true, 'Date is confirmed', 999, 999)
) AS v(name, display_name, sort_order, is_active, description, created_by, last_updated_by)
WHERE NOT EXISTS (SELECT 1 FROM date_statuses WHERE date_statuses.name = v.name);

-- ============================================================================
-- TIME STATUSES
-- Time statuses for activities
-- Values: 'unknown', 'tentative', 'confirmed'
-- ============================================================================

INSERT INTO time_statuses (name, display_name, sort_order, is_active, description, created_by, last_updated_by)
SELECT * FROM (VALUES
  ('not_confirmed', 'Not confirmed', 1, true, 'Time is not confirmed', 999, 999),
  ('tentative', 'Tentative', 2, true, 'Time is tentatively scheduled', 999, 999),
  ('confirmed', 'Confirmed', 3, true, 'Time is confirmed', 999, 999)
) AS v(name, display_name, sort_order, is_active, description, created_by, last_updated_by)
WHERE NOT EXISTS (SELECT 1 FROM time_statuses WHERE time_statuses.name = v.name);

-- ============================================================================
-- VENUE STATUSES
-- Linked to activities.venue_status_id (TBC / TBD only).
-- ============================================================================

INSERT INTO venue_statuses (name, display_name, sort_order, is_active, description, created_by, last_updated_by)
SELECT * FROM (VALUES
  ('TBD', 'Venue TBD', 1, true, 'Venue to be determined', 999, 999),
  ('TBC', 'Venue TBC', 2, true, 'Venue to be confirmed', 999, 999)
) AS v(name, display_name, sort_order, is_active, description, created_by, last_updated_by)
WHERE NOT EXISTS (SELECT 1 FROM venue_statuses WHERE venue_statuses.name = v.name);

-- ============================================================================
-- PITCH REQUIRED STATUSES (pending, required, not_required)
-- ============================================================================
INSERT INTO pitch_required_statuses (id, name, display_name, sort_order, is_active, created_by, last_updated_by)
VALUES
  (1, 'pending', 'Pending review', 1, true, 999, 999),
  (2, 'required', 'Required', 2, true, 999, 999),
  (3, 'not_required', 'Not Required', 3, true, 999, 999)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- TRANSLATION REQUIRED STATUSES (pending, required, not_required)
-- ============================================================================
INSERT INTO translation_required_statuses (id, name, display_name, sort_order, is_active, created_by, last_updated_by)
VALUES
  (1, 'pending', 'Pending review', 1, true, 999, 999),
  (2, 'required', 'Required', 2, true, 999, 999),
  (3, 'not_required', 'Not required', 3, true, 999, 999)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- CATEGORIES
-- Classification categories for activities
-- Team-scoped categories (visibility = team) require team_categories (see teams seed).
-- ============================================================================

INSERT INTO categories (id, name, display_name, sort_order, visibility, is_active, description, created_by, last_updated_by)
VALUES
  (1, 'event', 'Event', 1, 'global', true, 'Event category', 999, 999),
  (2, 'release', 'Release', 2, 'global', true, 'Release category', 999, 999),
  (3, 'awareness', 'Awareness date', 3, 'global', true, 'Awareness category', 999, 999),
  (4, 'conference', 'Conference / AGM / Forum', 4, 'global', true, 'Conference / AGM / Forum category', 999, 999),
  (5, 'fyi', 'FYI', 5, 'global', true, 'FYI category (use for internal awareness)', 999, 999),
  (6, 'social media', 'Social media', 6, 'global', true, 'Social media category', 999, 999),
  (7, 'speech', 'Speech', 7, 'global', true, 'Speech category', 999, 999),
  (8, 'tv radio', 'TV/Radio', 8, 'global', true, 'TV/Radio category', 999, 999),
  (9, 'hq placeholder', 'HQ Placeholder', 9, 'team', true, 'HQ Placeholder category (CCHQ)', 999, 999),
  (10, 'igrs event', 'IGRS Event', 10, 'team', true, 'IGRS event category', 999, 999),
  (11, 'half-masting', 'Half-masting', 11, 'team', true, 'Half-masting category', 999, 999),
  (12, 'national day', 'National day', 12, 'team', true, 'National day category', 999, 999),
  (13, 'visit', 'Visit', 13, 'team', true, 'Visit category', 999, 999)
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
  (1, 'backgrounder', 'Backgrounder', 1, true, 'Background information materials', 999, 999),
  (2, 'digital content', 'Digital content', 2, true, 'Digital content materials', 999, 999),
  (3, 'event or media plan', 'Event or media plan', 3, true, 'Event or media planning materials', 999, 999),
  (4, 'factsheet', 'Factsheet', 4, true, 'Fact sheet materials', 999, 999),
  (5, 'information bulletin', 'Information bulletin', 5, true, 'Information bulletin materials', 999, 999),
  (6, 'issues note', 'Issues note', 6, true, 'Issues note materials', 999, 999),
  (7, 'itinerary', 'Itinerary', 7, true, 'Itinerary materials', 999, 999),
  (8, 'key messages', 'Key messages', 8, true, 'Key messaging materials', 999, 999),
  (9, 'media advisory', 'Media advisory', 9, true, 'Media advisory materials', 999, 999),
  (10, 'ministers message', 'Minister''s message', 10, true, 'Minister''s message materials', 999, 999),
  (11, 'news release', 'News release', 11, true, 'News release materials', 999, 999),
  (12, 'nycu news you can use', 'NYCU', 12, true, 'NYCU (News You Can Use) materials', 999, 999),
  (13, 'opinion editorial', 'Opinion editorial', 13, true, 'Opinion editorial materials', 999, 999),
  (14, 'press conference', 'Press conference', 14, true, 'Press conference materials', 999, 999),
  (15, 'q and a', 'Q&As', 15, true, 'Question and answer materials', 999, 999),
  (16, 'quote', 'Quote', 16, true, 'Quote materials', 999, 999),
  (17, 'report', 'Report', 17, true, 'Report materials', 999, 999),
  (18, 'speaking notes', 'Speaking notes', 18, true, 'Speaking notes materials', 999, 999),
  (19, 'statement', 'Statement', 19, true, 'Statement materials', 999, 999),
  (20, 'tech briefing', 'Tech briefing', 20, true, 'Technical briefing materials', 999, 999),
  (21, 'igrs biography', 'IGRS: Biography', 21, true, 'IGRS biography materials', 999, 999),
  (22, 'igrs briefing note', 'IGRS: Briefing note', 22, true, 'IGRS briefing note materials', 999, 999),
  (23, 'igrs gift', 'IGRS: Gift', 23, true, 'IGRS gift materials', 999, 999)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- TRANSLATED LANGUAGES
-- Languages for translations. shortcode values are internal language codes.
-- ============================================================================

INSERT INTO translated_languages (id, name, display_name, shortcode, sort_order, is_active, description, created_by, last_updated_by)
VALUES
  (1, 'arabic', 'Arabic', 'AR', 1, true, 'Arabic', 999, 999),
  (2, 'chinese simplified', 'Chinese (Simplified)', 'SC', 2, true, 'Chinese (Simplified)', 999, 999),
  (3, 'chinese traditional', 'Chinese (Traditional)', 'TC', 3, true, 'Chinese (Traditional)', 999, 999),
  (4, 'dutch', 'Dutch', 'DUT', 4, true, 'Dutch', 999, 999),
  (5, 'farsi', 'Farsi', 'FAR', 5, true, 'Farsi', 999, 999),
  (6, 'finnish', 'Finnish', 'FIN', 6, true, 'Finnish', 999, 999),
  (7, 'french', 'French', 'FR', 7, true, 'French', 999, 999),
  (8, 'gujarati', 'Gujarati', 'GUJ', 8, true, 'Gujarati', 999, 999),
  (9, 'hebrew', 'Hebrew', 'HE', 9, true, 'Hebrew', 999, 999),
  (10, 'hindi', 'Hindi', 'HI', 10, true, 'Hindi', 999, 999),
  (11, 'indonesian', 'Indonesian', 'IND', 11, true, 'Indonesian', 999, 999),
  (12, 'italian', 'Italian', 'IT', 12, true, 'Italian', 999, 999),
  (13, 'japanese', 'Japanese', 'JP', 13, true, 'Japanese', 999, 999),
  (14, 'korean', 'Korean', 'KO', 14, true, 'Korean', 999, 999),
  (15, 'portuguese', 'Portuguese', 'POR', 15, true, 'Portuguese', 999, 999),
  (16, 'punjabi', 'Punjabi', 'PUN', 16, true, 'Punjabi', 999, 999),
  (17, 'russian', 'Russian', 'RU', 17, true, 'Russian', 999, 999),
  (18, 'somali', 'Somali', 'SOM', 18, true, 'Somali', 999, 999),
  (19, 'spanish', 'Spanish', 'SPA', 19, true, 'Spanish', 999, 999),
  (20, 'swahili', 'Swahili', 'SWA', 20, true, 'Swahili', 999, 999),
  (21, 'tagalog', 'Tagalog', 'TL', 21, true, 'Tagalog', 999, 999),
  (22, 'ukrainian', 'Ukrainian', 'UKR', 22, true, 'Ukrainian', 999, 999),
  (23, 'urdu', 'Urdu', 'URD', 23, true, 'Urdu', 999, 999),
  (24, 'vietnamese', 'Vietnamese', 'VN', 24, true, 'Vietnamese', 999, 999)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- CITIES
-- Cities for activities
-- ============================================================================

INSERT INTO cities (id, name, display_name, sort_order, is_active, province_or_state, country, created_by, last_updated_by) VALUES
  (1, 'Victoria', 'Victoria', 1, true, 'BC', 'Canada', 999, 999),
  (2, 'Vancouver', 'Vancouver', 2, true, 'BC', 'Canada', 999, 999),
  (3, 'Kelowna', 'Kelowna', 3, true, 'BC', 'Canada', 999, 999),
  (4, 'Nanaimo', 'Nanaimo', 4, true, 'BC', 'Canada', 999, 999),
  (5, 'Kamloops', 'Kamloops', 5, true, 'BC', 'Canada', 999, 999),
  (6, 'Prince George', 'Prince George', 6, true, 'BC', 'Canada', 999, 999),
  (7, 'Terrace', 'Terrace', 7, true, 'BC', 'Canada', 999, 999),
  (8, 'Vernon', 'Vernon', 8, true, 'BC', 'Canada', 999, 999),
  (9, 'Williams Lake', 'Williams Lake', 9, true, 'BC', 'Canada', 999, 999),
  (10, 'Prince Rupert', 'Prince Rupert', 10, true, 'BC', 'Canada', 999, 999),
  (11, 'Smithers', 'Smithers', 11, true, 'BC', 'Canada', 999, 999),
  (12, 'Surrey', 'Surrey', 12, true, 'BC', 'Canada', 999, 999),
  (13, 'Burnaby', 'Burnaby', 13, true, 'BC', 'Canada', 999, 999),
  (14, 'Richmond', 'Richmond', 14, true, 'BC', 'Canada', 999, 999),
  (15, 'Abbotsford', 'Abbotsford', 15, true, 'BC', 'Canada', 999, 999),
  (16, 'Coquitlam', 'Coquitlam', 16, true, 'BC', 'Canada', 999, 999),
  (17, 'Delta', 'Delta', 17, true, 'BC', 'Canada', 999, 999),
  (18, 'Toronto', 'Toronto', 18, true, 'ON', 'Canada', 999, 999),
  (19, 'Ottawa', 'Ottawa', 19, true, 'ON', 'Canada', 999, 999),
  (20, 'Montreal', 'Montreal', 20, true, 'QC', 'Canada', 999, 999),
  (21, 'Calgary', 'Calgary', 21, true, 'AB', 'Canada', 999, 999),
  (22, 'Edmonton', 'Edmonton', 22, true, 'AB', 'Canada', 999, 999),
  (23, 'Winnipeg', 'Winnipeg', 23, true, 'MB', 'Canada', 999, 999),
  (24, 'Halifax', 'Halifax', 24, true, 'NS', 'Canada', 999, 999),
  (25, 'Quebec City', 'Quebec City', 25, true, 'QC', 'Canada', 999, 999)
ON CONFLICT (id) DO NOTHING;


-- ============================================================================
-- NEWS RELEASE DISTRIBUTIONS
-- News release distribution types
-- Updated with new values
-- ============================================================================

INSERT INTO news_release_distributions (id, name, display_name, sort_order, is_active, description, created_by, last_updated_by) VALUES
  (1, 'tbd', 'TBD', 1, true, 'Distribution to be determined', 999, 999),
  (2, 'provincewide', 'Provincewide', 2, true, 'Provincewide distribution', 999, 999),
  (3, 'regional', 'Regional', 3, true, 'Regional distribution', 999, 999),
  (4, 'web post only', 'Web post only', 4, true, 'Web post only distribution', 999, 999),
  (5, 'direct send only', 'Direct send only', 5, true, 'Direct send only distribution', 999, 999),
  (6, 'national', 'National', 6, true, 'National distribution', 999, 999),
  (7, 'other', 'Other', 7, true, 'Other distribution type', 999, 999)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- PREMIER REQUESTED
-- Premier request types
-- Updated with new values
-- ============================================================================

INSERT INTO premier_requested (id, name, display_name, sort_order, is_active, description, created_by, last_updated_by) VALUES
  (1, 'yes', 'Yes', 1, true, 'Premier requested', 999, 999),
  (2, 'no', 'No', 2, true, 'Premier not requested', 999, 999),
  (3, 'tbc', 'TBC', 3, true, 'Premier request to be confirmed', 999, 999),
  (4, 'confirmed', 'Confirmed', 4, true, 'Premier request confirmed', 999, 999),
  (5, 'not available', 'Not available', 5, true, 'Premier not available', 999, 999)
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
    999,
    999
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
    999,
    999
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
    999,
    999
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
    999,
    999
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
    999,
    999
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
  ('BC Legislature', '501 Belleville St', 'Victoria', 'British Columbia', 'Canada', 1, true, true, 1, 999, 999),
  ('Vancouver Convention Centre', '1055 Canada Pl', 'Vancouver', 'British Columbia', 'Canada', 2, true, true, 2, 999, 999),
  ('Government House', '1401 Rockland Ave', 'Victoria', 'British Columbia', 'Canada', 3, true, true, 3, 999, 999)
) AS v(venue_name, address_line1, city, province_or_state, country, sort_order, is_active, is_pinned, pinned_sort_order, created_by, last_updated_by)
WHERE NOT EXISTS (SELECT 1 FROM venue_presets LIMIT 1);
