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

INSERT INTO teams (id, name, display_name, description, sort_order, is_active, created_by, last_updated_by) VALUES
  -- GCPE teams (sort_order 1-7)
  (1, 'MR', 'Media Relations', 'Media Relations', 1, true, 1, 1),
  (2, 'CC HQ', 'CC HQ', 'Corporate Calendar Admin', 2, true, 1, 1),
  (3, 'Editorial', 'Editorial', 'Editorial Services', 3, true, 1, 1),
  (4, 'Events', 'Events', 'Corporate Events', 4, true, 1, 1),
  (5, 'Digital Comms', 'Digital Comms', 'Digital Communications', 5, true, 1, 1),
  (6, 'Issues Management', 'Issues', 'Issues Management', 6, true, 1, 1),
  (7, 'GCPE Exec', 'GCPE Exec', 'GCPE Executive', 7, true, 1, 1),
  -- Ministry Comms: PREM then AGRI through WLRS (sort_order 8-32)
  (8, 'PREM', 'PREM', 'Office of the Premier', 8, true, 1, 1),
  (9, 'AGRI Comms', 'AGRI Comms', 'Agriculture and Food Comms', 9, true, 1, 1),
  (10, 'AG Comms', 'AG Comms', 'Attorney General Comms', 10, true, 1, 1),
  (11, 'CFD Comms', 'CFD Comms', 'Children and Family Development Comms', 11, true, 1, 1),
  (12, 'CITZ Comms', 'CITZ Comms', 'Citizens'' Services Comms', 12, true, 1, 1),
  (13, 'EDUC Comms', 'EDUC Comms', 'Education and Child Care Comms', 13, true, 1, 1),
  (14, 'EMCR Comms', 'EMCR Comms', 'Emergency Management and Climate Readiness Comms', 14, true, 1, 1),
  (15, 'ENER Comms', 'ENER Comms', 'Energy and Climate Solutions Comms', 15, true, 1, 1),
  (16, 'ENV Comms', 'ENV Comms', 'Environment and Parks Comms', 16, true, 1, 1),
  (17, 'FIN Comms', 'FIN Comms', 'Finance Comms', 17, true, 1, 1),
  (18, 'FOR Comms', 'FOR Comms', 'Forests Comms', 18, true, 1, 1),
  (19, 'HLTH Comms', 'HLTH Comms', 'Health Comms', 19, true, 1, 1),
  (20, 'HOUS Comms', 'HOUS Comms', 'Housing and Municipal Affairs Comms', 20, true, 1, 1),
  (21, 'IRR Comms', 'IRR Comms', 'Indigenous Relations and Reconciliation Comms', 21, true, 1, 1),
  (22, 'INFRA Comms', 'INFRA Comms', 'Infrastructure Comms', 22, true, 1, 1),
  (23, 'IGRS Comms', 'IGRS Comms', 'Intergovernmental Relations Secretariat Comms', 23, true, 1, 1),
  (24, 'JEG Comms', 'JEG Comms', 'Jobs and Economic Growth Comms', 24, true, 1, 1),
  (25, 'LAB Comms', 'LAB Comms', 'Labour Comms', 25, true, 1, 1),
  (26, 'MIN Comms', 'MIN Comms', 'Mining and Critical Minerals Comms', 26, true, 1, 1),
  (27, 'PSFS Comms', 'PSFS Comms', 'Post-Secondary Education and Future Skills Comms', 27, true, 1, 1),
  (28, 'PSSG Comms', 'PSSG Comms', 'Public Safety and Solicitor General Comms', 28, true, 1, 1),
  (29, 'SDPR Comms', 'SDPR Comms', 'Social Development and Poverty Reduction Comms', 29, true, 1, 1),
  (30, 'TACS Comms', 'TACS Comms', 'Tourism, Arts, Culture and Sport Comms', 30, true, 1, 1),
  (31, 'TRAN Comms', 'TRAN Comms', 'Transportation and Transit Comms', 31, true, 1, 1),
  (32, 'WLRS Comms', 'WLRS Comms', 'Water, Land and Resource Stewardship Comms', 32, true, 1, 1),
  -- Crown / other teams (sort_order 33-36)
  (33, 'BC Wildfire', 'BC Wildfire', 'BC Wildfire Service', 33, true, 1, 1),
  (34, 'BC Coroners', 'BC Coroners', 'BC Coroners Service', 34, true, 1, 1),
  (35, 'IGRS', 'IGRS', 'Intergovernmental Relations Secretariat', 35, true, 1, 1),
  (36, 'EAO', 'EAO', 'Environmental Assessment Office', 36, true, 1, 1)
ON CONFLICT (id) DO NOTHING;

-- Reset sequence so future inserts get ids > 36
SELECT setval('teams_id_seq', COALESCE((SELECT MAX(id) FROM teams), 1), true);

-- ----------------------------------------------------------------------------
-- TEAM MINISTRY (teams.ministry_id)
-- CCHQ (2) and IGRS (35): Premier's Office (1).
-- Ministry Comms (8-32): PREM=1, AGRI=2, ... WLRS=25.
-- Crown: BC Wildfire->FOR(11), BC Coroners->PSSG(21), EAO->ENV(9).
-- ----------------------------------------------------------------------------

UPDATE teams SET ministry_id = 1 WHERE id IN (2, 8, 35);
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
-- USER_TEAMS
-- Editor (2-12): each in one Ministry Comms team; 2 Editors in 2 teams (2 and 3).
-- View Only (1): one Ministry Comms team (any except PREM).
-- Advanced (13-17): GCPE teams except CC HQ (MR, Editorial, Events, Digital Comms, Issues, GCPE Exec).
-- Admin (18-19): CC HQ only. System Admin (20): CC HQ for consistency.
-- ----------------------------------------------------------------------------

INSERT INTO user_teams (user_id, team_id, role, is_active) VALUES
  -- View Only (user 1): one Ministry Comms team other than PREM (e.g. INFRA Comms, 22)
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
