-- ============================================================================
-- TEAMS AND USER-TEAM ASSIGNMENTS
-- Seeds teams for datascoping; run after lookups (users, ministries) and
-- optionally after activities seed. Idempotent: ON CONFLICT DO NOTHING.
-- Team ministry (teams.ministry_id) is set below for scoping.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- TEAMS
-- GCPE teams (1-7), Ministry Comms (8-32), Crown / other (33-36)
-- ----------------------------------------------------------------------------

-- abbreviation: stable short code for activity displayId when the team has no lead ministry
-- (and fallback when a ministry record lacks an abbreviation), max 6 chars per schema
INSERT INTO teams (id, name, display_name, abbreviation, description, sort_order, is_active, created_by, last_updated_by) VALUES
  -- GCPE teams (sort_order 1-7)
  (1, 'MR', 'Media Relations', 'MR', 'Media Relations', 1, true, 1, 1),
  (2, 'CCHQ', 'CCHQ', 'CCHQ', 'Corporate Calendar Admin', 2, true, 1, 1),
  (3, 'Editorial', 'Editorial', 'EDIT', 'Editorial Services', 3, true, 1, 1),
  (4, 'Events', 'Events', 'EVNT', 'Corporate Events', 4, true, 1, 1),
  (5, 'Digital Comms', 'Digital Comms', 'DIGI', 'Digital Communications', 5, true, 1, 1),
  (6, 'Issues Management', 'Issues', 'ISSU', 'Issues Management', 6, true, 1, 1),
  (7, 'GCPE Exec', 'GCPE Exec', 'EXEC', 'GCPE Executive', 7, true, 1, 1),
  -- Ministry Comms: PREM then AGRI through WLRS (sort_order 8-32)
  (8, 'PREM', 'PREM', 'PREM', 'Office of the Premier', 8, true, 1, 1),
  (9, 'AF Comms', 'AF Comms', 'AF', 'Agriculture and Food Comms', 9, true, 1, 1),
  (10, 'AG Comms', 'AG Comms', 'AG', 'Attorney General Comms', 10, true, 1, 1),
  (11, 'MCFD Comms', 'MCFD Comms', 'MCFD', 'Children and Family Development Comms', 11, true, 1, 1),
  (12, 'CITZ Comms', 'CITZ Comms', 'CITZ', 'Citizens'' Services Comms', 12, true, 1, 1),
  (13, 'ECC Comms', 'ECC Comms', 'ECC', 'Education and Child Care Comms', 13, true, 1, 1),
  (14, 'EMCR Comms', 'EMCR Comms', 'EMCR', 'Emergency Management and Climate Readiness Comms', 14, true, 1, 1),
  (15, 'ECS Comms', 'ECS Comms', 'ECS', 'Energy and Climate Solutions Comms', 15, true, 1, 1),
  (16, 'ENV Comms', 'ENV Comms', 'ENV', 'Environment and Parks Comms', 16, true, 1, 1),
  (17, 'FIN Comms', 'FIN Comms', 'FIN', 'Finance Comms', 17, true, 1, 1),
  (18, 'FOR Comms', 'FOR Comms', 'FOR', 'Forests Comms', 18, true, 1, 1),
  (19, 'HLTH Comms', 'HLTH Comms', 'HLTH', 'Health Comms', 19, true, 1, 1),
  (20, 'HMA Comms', 'HMA Comms', 'HMA', 'Housing and Municipal Affairs Comms', 20, true, 1, 1),
  (21, 'IRR Comms', 'IRR Comms', 'IRR', 'Indigenous Relations and Reconciliation Comms', 21, true, 1, 1),
  (22, 'INF Comms', 'INF Comms', 'INF', 'Infrastructure Comms', 22, true, 1, 1),
  (23, 'IGRS Comms', 'IGRS Comms', 'IGRS', 'Intergovernmental Relations Secretariat Comms', 23, true, 1, 1),
  (24, 'JEG Comms', 'JEG Comms', 'JEG', 'Jobs and Economic Growth Comms', 24, true, 1, 1),
  (25, 'LAB Comms', 'LAB Comms', 'LAB', 'Labour Comms', 25, true, 1, 1),
  (26, 'MIN Comms', 'MIN Comms', 'MIN', 'Mining and Critical Minerals Comms', 26, true, 1, 1),
  (27, 'PSFS Comms', 'PSFS Comms', 'PSFS', 'Post-Secondary Education and Future Skills Comms', 27, true, 1, 1),
  (28, 'PSSG Comms', 'PSSG Comms', 'PSSG', 'Public Safety and Solicitor General Comms', 28, true, 1, 1),
  (29, 'SDPR Comms', 'SDPR Comms', 'SDPR', 'Social Development and Poverty Reduction Comms', 29, true, 1, 1),
  (30, 'TACS Comms', 'TACS Comms', 'TACS', 'Tourism, Arts, Culture and Sport Comms', 30, true, 1, 1),
  (31, 'MOTT Comms', 'MOTT Comms', 'MOTT', 'Transportation and Transit Comms', 31, true, 1, 1),
  (32, 'WLRS Comms', 'WLRS Comms', 'WLRS', 'Water, Land and Resource Stewardship Comms', 32, true, 1, 1),
  -- Crown / other teams (sort_order 33-36)
  (33, 'BC Wildfire', 'BC Wildfire', 'BCWS', 'BC Wildfire Service', 33, true, 1, 1),
  (34, 'BC Coroners', 'BC Coroners', 'BCCS', 'BC Coroners Service', 34, true, 1, 1),
  (35, 'IGRS', 'IGRS', 'IGRS', 'Intergovernmental Relations Secretariat', 35, true, 1, 1),
  (36, 'EAO', 'EAO', 'EAO', 'Environmental Assessment Office', 36, true, 1, 1)
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- TEAM_CATEGORIES
-- Links team-scoped categories (categories.visibility = team) to teams.
-- Requires categories seed (0001). CCHQ id=2, IGRS id=35.
-- ----------------------------------------------------------------------------

INSERT INTO team_categories (category_id, team_id, is_active) VALUES
  (9, 2, true),
  (10, 35, true),
  (11, 35, true),
  (12, 35, true),
  (13, 35, true)
ON CONFLICT (category_id, team_id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- TEAM MINISTRY (teams.ministry_id)
-- Ministry Comms (8-32): PREM=1, AF=2, ... WLRS=25 (ministry id matches org id 1-25).
-- Crown: BC Wildfire->FOR(11), BC Coroners->PSSG(21), EAO->EP(9).
-- ----------------------------------------------------------------------------

UPDATE teams SET ministry_id = 1 WHERE id = 8;
UPDATE teams SET ministry_id = 2 WHERE id = 9;
UPDATE teams SET ministry_id = 3 WHERE id = 10;
UPDATE teams SET ministry_id = 4 WHERE id = 11;
UPDATE teams SET ministry_id = 5 WHERE id = 12;
UPDATE teams SET ministry_id = 6 WHERE id = 13;
UPDATE teams SET ministry_id = 7 WHERE id = 14;
UPDATE teams SET ministry_id = 8 WHERE id = 15;
UPDATE teams SET ministry_id = 9 WHERE id = 16;
UPDATE teams SET ministry_id = 10 WHERE id = 17;
UPDATE teams SET ministry_id = 11 WHERE id IN (18, 33);
UPDATE teams SET ministry_id = 12 WHERE id = 19;
UPDATE teams SET ministry_id = 13 WHERE id = 20;
UPDATE teams SET ministry_id = 14 WHERE id = 21;
UPDATE teams SET ministry_id = 15 WHERE id = 22;
UPDATE teams SET ministry_id = 16 WHERE id = 23;
UPDATE teams SET ministry_id = 17 WHERE id = 24;
UPDATE teams SET ministry_id = 18 WHERE id = 25;
UPDATE teams SET ministry_id = 19 WHERE id = 26;
UPDATE teams SET ministry_id = 20 WHERE id = 27;
UPDATE teams SET ministry_id = 21 WHERE id IN (28, 34);
UPDATE teams SET ministry_id = 22 WHERE id = 29;
UPDATE teams SET ministry_id = 23 WHERE id = 30;
UPDATE teams SET ministry_id = 24 WHERE id = 31;
UPDATE teams SET ministry_id = 25 WHERE id = 32;
UPDATE teams SET ministry_id = 9 WHERE id = 36;

-- ----------------------------------------------------------------------------
-- TEAM ROLE (teams.role_id)
-- Role IDs: 1=Viewer, 2=Editor, 3=Advanced Viewer, 4=Advanced Editor, 5=Admin, 6=System Admin
-- 2=Admin; 1,3-7=Advanced Viewer; 8-32,35=Editor; 33,34,36=Viewer
-- ----------------------------------------------------------------------------

UPDATE teams SET role_id = 5 WHERE id = 2;
UPDATE teams SET role_id = 3 WHERE id IN (1, 3, 4, 5, 6, 7);

-- ----------------------------------------------------------------------------
-- Remove Editor role from Ministry Comms teams; must be explicitly set for each user.
-- Comms teams may need to have Viewer members.
-- UPDATE teams SET role_id = 2 WHERE id IN (8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 35);
-- ----------------------------------------------------------------------------
UPDATE teams SET role_id = 1 WHERE id IN (33, 34, 36);

-- ----------------------------------------------------------------------------
-- USER_TEAMS
-- Editor (2-51): Ministry Comms teams (8-32) have at least 3 active members each.
-- View Only (1): one Ministry Comms team (any except PREM).
-- Advanced (13-17): GCPE teams except CC HQ (MR, Editorial, Events, Digital Comms, Issues, GCPE Exec).
-- Admin (18-19): CC HQ only. System Admin (20): CC HQ for consistency.
-- ----------------------------------------------------------------------------

INSERT INTO user_teams (user_id, team_id, role, is_active) VALUES
  -- View Only (user 1): one Ministry Comms team other than PREM (e.g. INF Comms, 22)
  (1, 22, 'member', true),
  -- Editors (2-12): each in one Ministry Comms; users 2 and 3 in two teams each
  (2, 9, 'member', true),
  (2, 12, 'member', true),
  (3, 10, 'member', true),
  (3, 13, 'member', true),
  (4, 11, 'member', true),
  (5, 14, 'member', true),
  (6, 15, 'member', true),
  (7, 16, 'member', true),
  (8, 17, 'member', true),
  (9, 18, 'member', true),
  (10, 19, 'member', true),
  (11, 20, 'member', true),
  (12, 21, 'member', true),
  -- Additional Editors (21-51): ensure 3 comms-contact candidates per Comms team (8-32)
  (21, 8, 'member', true),
  (21, 9, 'member', true),
  (22, 8, 'member', true),
  (22, 9, 'member', true),
  (23, 8, 'member', true),
  (23, 10, 'member', true),
  (24, 10, 'member', true),
  (24, 11, 'member', true),
  (25, 11, 'member', true),
  (25, 12, 'member', true),
  (26, 12, 'member', true),
  (26, 13, 'member', true),
  (27, 13, 'member', true),
  (27, 14, 'member', true),
  (28, 14, 'member', true),
  (28, 15, 'member', true),
  (29, 15, 'member', true),
  (29, 16, 'member', true),
  (30, 16, 'member', true),
  (30, 17, 'member', true),
  (31, 17, 'member', true),
  (31, 18, 'member', true),
  (32, 18, 'member', true),
  (32, 19, 'member', true),
  (33, 19, 'member', true),
  (33, 20, 'member', true),
  (34, 20, 'member', true),
  (34, 21, 'member', true),
  (35, 21, 'member', true),
  (35, 22, 'member', true),
  (36, 22, 'member', true),
  (36, 23, 'member', true),
  (37, 23, 'member', true),
  (37, 24, 'member', true),
  (38, 23, 'member', true),
  (38, 24, 'member', true),
  (39, 24, 'member', true),
  (39, 25, 'member', true),
  (40, 25, 'member', true),
  (40, 26, 'member', true),
  (41, 25, 'member', true),
  (41, 26, 'member', true),
  (42, 26, 'member', true),
  (42, 27, 'member', true),
  (43, 27, 'member', true),
  (43, 28, 'member', true),
  (44, 27, 'member', true),
  (44, 28, 'member', true),
  (45, 28, 'member', true),
  (45, 29, 'member', true),
  (46, 29, 'member', true),
  (46, 30, 'member', true),
  (47, 29, 'member', true),
  (47, 30, 'member', true),
  (48, 30, 'member', true),
  (48, 31, 'member', true),
  (49, 31, 'member', true),
  (49, 32, 'member', true),
  (50, 31, 'member', true),
  (50, 32, 'member', true),
  (51, 32, 'member', true),
  -- Advanced (13-17): GCPE teams except CC HQ (1=MR, 3=Editorial, 4=Events, 5=Digital Comms, 6=Issues, 7=GCPE Exec)
  (13, 1, 'member', true),
  (13, 7, 'member', true),
  (14, 3, 'member', true),
  (15, 4, 'member', true),
  (16, 5, 'member', true),
  (17, 6, 'member', true),
  -- Admin (18-19): CC HQ only (2)
  (18, 2, 'member', true),
  (19, 2, 'member', true),
  -- System Admin (20): CC HQ for consistency
  (20, 2, 'member', true)
ON CONFLICT (user_id, team_id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- TEAM_HISTORY (optional audit)
-- One 'created' row per team, idempotent: only insert when none exists for that team.
-- ----------------------------------------------------------------------------

INSERT INTO team_history (team_id, changed_by_user_id, action_type, changes, notes)
SELECT t.id, 1, 'created', '[]'::jsonb, 'Seeded by system seed script'
FROM teams t
WHERE NOT EXISTS (
  SELECT 1 FROM team_history th
  WHERE th.team_id = t.id AND th.action_type = 'created'
);

-- ----------------------------------------------------------------------------
-- USER_HISTORY (optional audit)
-- One 'created' row per user, idempotent: only insert when none exists for that user.
-- ----------------------------------------------------------------------------

INSERT INTO user_history (user_id, changed_by_user_id, action_type, changes, notes)
SELECT u.id, 1, 'created', '[]'::jsonb, 'Seeded by system seed script'
FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM user_history uh
  WHERE uh.user_id = u.id AND uh.action_type = 'created'
);

-- 3. Mock team field grants (teams seed ids 1-8). GCPE 1-7 + PREM (8): notes / lookAhead / pitchStatus view.
INSERT INTO team_permissions (team_id, permission_id)
SELECT u.team_id, p.id
FROM (VALUES (1), (2), (3), (4), (5), (6), (7), (8)) AS u(team_id)
CROSS JOIN permissions p
WHERE p.key IN (
  'activities.notes.view',
  'activities.lookAhead.view',
  'activities.pitchStatus.view'
)
ON CONFLICT (team_id, permission_id) DO NOTHING;

-- CCHQ (2): field edits for mock testing
INSERT INTO team_permissions (team_id, permission_id)
SELECT 2, p.id
FROM permissions p
WHERE p.key IN (
  'activities.notes.edit',
  'activities.lookAhead.edit',
  'activities.translations.edit',
  'activities.pitchDate.edit'
)
ON CONFLICT (team_id, permission_id) DO NOTHING;

-- MR (1): translations edit only
INSERT INTO team_permissions (team_id, permission_id)
SELECT 1, p.id
FROM permissions p
WHERE p.key = 'activities.translations.edit'
ON CONFLICT (team_id, permission_id) DO NOTHING;
-- Enforce pitch-required status edit access for Advanced Editor+ roles only.
-- Idempotent and safe to re-run.

-- Remove legacy team-scoped edit grants that could allow non-elevated edits.
DELETE FROM team_permissions tp
USING permissions p
WHERE tp.permission_id = p.id
  AND p.key = 'activities.pitchStatus.edit';
