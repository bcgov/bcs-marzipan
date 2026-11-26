-- ============================================================================
-- TEAMS AND USER-TEAM ASSIGNMENTS
-- ============================================================================

INSERT INTO teams (id, name, display_name, abbreviation, description, sort_order, is_active, created_by, last_updated_by) VALUES
  -- GCPE teams (sort_order 1-7)
  (1, 'MR', 'Media Relations', 'MR', 'Media Relations', 1, true, 1, 1),
  (2, 'CCHQ', 'CCHQ', 'CCHQ', 'Corporate Calendar Admin', 2, true, 1, 1),
  (3, 'Editorial', 'Editorial', 'EDIT', 'Editorial Services', 3, true, 1, 1),
  (4, 'Events', 'Events', 'EVNT', 'Corporate Events', 4, true, 1, 1),
  (5, 'Digital Comms', 'Digital Comms', 'DIGI', 'Digital Communications', 5, true, 1, 1),
  (6, 'Issues Management', 'Issues', 'ISSU', 'Issues Management', 6, true, 1, 1),
  (7, 'GCPE Exec', 'GCPE Exec', 'EXEC', 'GCPE Executive', 7, true, 1, 1),
  -- Ministry Comms (sort_order 8-27): org ids 1-20
  (8, 'PREM', 'PREM', 'PREM', 'Office of the Premier', 8, true, 1, 1),
  (9, 'IGRS Comms', 'IGRS Comms', 'IGRS', 'Intergovernmental Relations Secretariat Comms', 9, true, 1, 1),
  (10, 'AGRI Comms', 'AGRI Comms', 'AGRI', 'Agriculture Comms', 10, true, 1, 1),
  (11, 'AG Comms', 'AG Comms', 'AG', 'Attorney General Comms', 11, true, 1, 1),
  (12, 'CFD Comms', 'CFD Comms', 'CFD', 'Children and Family Development Comms', 12, true, 1, 1),
  (13, 'CITZ Comms', 'CITZ Comms', 'CITZ', 'Citizens'' Services and Technology Comms', 13, true, 1, 1),
  (14, 'ECON Comms', 'ECON Comms', 'ECON', 'Economic Development and Tourism Comms', 14, true, 1, 1),
  (15, 'ECC Comms', 'ECC Comms', 'ECC', 'Education and Child Care Comms', 15, true, 1, 1),
  (16, 'EMPR Comms', 'EMPR Comms', 'EMPR', 'Energy, Mines and Petroleum Resources Comms', 16, true, 1, 1),
  (17, 'ENV Comms', 'ENV Comms', 'ENV', 'Environment Comms', 17, true, 1, 1),
  (18, 'FIN Comms', 'FIN Comms', 'FIN', 'Finance Comms', 18, true, 1, 1),
  (19, 'FOR Comms', 'FOR Comms', 'FOR', 'Forests Comms', 19, true, 1, 1),
  (20, 'HLTH Comms', 'HLTH Comms', 'HLTH', 'Health Comms', 20, true, 1, 1),
  (21, 'IRR Comms', 'IRR Comms', 'IRR', 'Indigenous Relations and Reconciliation Comms', 21, true, 1, 1),
  (22, 'LOCL Comms', 'LOCL Comms', 'LOCL', 'Local Government, Housing, Sport and Culture Comms', 22, true, 1, 1),
  (23, 'PSEL Comms', 'PSEL Comms', 'PSEL', 'Post-Secondary Education and Labour Comms', 23, true, 1, 1),
  (24, 'PSSG Comms', 'PSSG Comms', 'PSSG', 'Public Safety and Solicitor General Comms', 24, true, 1, 1),
  (25, 'SDEV Comms', 'SDEV Comms', 'SDEV', 'Social Development Comms', 25, true, 1, 1),
  (26, 'MOTI Comms', 'MOTI Comms', 'MOTI', 'Transportation and Infrastructure Comms', 26, true, 1, 1),
  (27, 'WLRO Comms', 'WLRO Comms', 'WLRO', 'Water, Land and Natural Resource Operations Comms', 27, true, 1, 1),
  -- Crown / other (sort_order 33-36)
  (33, 'BC Wildfire', 'BC Wildfire', 'BCWS', 'BC Wildfire Service', 33, true, 1, 1),
  (34, 'BC Coroners', 'BC Coroners', 'BCCS', 'BC Coroners Service', 34, true, 1, 1),
  (35, 'IGRS', 'IGRS', 'IGRS', 'Intergovernmental Relations Secretariat', 35, true, 1, 1),
  (36, 'EAO', 'EAO', 'EAO', 'Environmental Assessment Office', 36, true, 1, 1)
ON CONFLICT (id) DO NOTHING;

UPDATE teams SET appears_in_share_with = false WHERE id BETWEEN 1 AND 7;

-- Team-scoped categories and comms materials (IGRS team id=35)
INSERT INTO team_categories (category_id, team_id, is_active) VALUES
  (9, 2, true),
  (10, 35, true),
  (11, 35, true),
  (12, 35, true),
  (13, 35, true)
ON CONFLICT (category_id, team_id) DO NOTHING;

INSERT INTO team_comms_materials (comms_material_id, team_id, is_active) VALUES
  (21, 35, true),
  (22, 35, true),
  (23, 35, true)
ON CONFLICT (comms_material_id, team_id) DO NOTHING;

-- Ministry Comms (8-27): primary_organization_id = org id 1-20
UPDATE teams SET primary_organization_id = 1 WHERE id = 8;
UPDATE teams SET primary_organization_id = 2 WHERE id = 9;
UPDATE teams SET primary_organization_id = 3 WHERE id = 10;
UPDATE teams SET primary_organization_id = 4 WHERE id = 11;
UPDATE teams SET primary_organization_id = 5 WHERE id = 12;
UPDATE teams SET primary_organization_id = 6 WHERE id = 13;
UPDATE teams SET primary_organization_id = 7 WHERE id = 14;
UPDATE teams SET primary_organization_id = 8 WHERE id = 15;
UPDATE teams SET primary_organization_id = 9 WHERE id = 16;
UPDATE teams SET primary_organization_id = 10 WHERE id = 17;
UPDATE teams SET primary_organization_id = 11 WHERE id = 18;
UPDATE teams SET primary_organization_id = 12 WHERE id IN (19, 33);
UPDATE teams SET primary_organization_id = 13 WHERE id = 20;
UPDATE teams SET primary_organization_id = 14 WHERE id = 21;
UPDATE teams SET primary_organization_id = 15 WHERE id = 22;
UPDATE teams SET primary_organization_id = 16 WHERE id = 23;
UPDATE teams SET primary_organization_id = 17 WHERE id IN (24, 34);
UPDATE teams SET primary_organization_id = 18 WHERE id = 25;
UPDATE teams SET primary_organization_id = 19 WHERE id = 26;
UPDATE teams SET primary_organization_id = 20 WHERE id = 27;
UPDATE teams SET primary_organization_id = 2 WHERE id = 35;
UPDATE teams SET primary_organization_id = NULL WHERE id = 36;

UPDATE teams SET role_id = 5 WHERE id = 2;
UPDATE teams SET role_id = 3 WHERE id IN (1, 3, 4, 5, 6, 7);
UPDATE teams SET role_id = 1 WHERE id IN (33, 34, 36);

INSERT INTO user_teams (user_id, team_id, role, is_active) VALUES
  (1, 16, 'member', true),
  (2, 8, 'member', true),
  (2, 18, 'member', true),
  (3, 11, 'member', true),
  (3, 20, 'member', true),
  (4, 12, 'member', true),
  (5, 13, 'member', true),
  (6, 14, 'member', true),
  (7, 15, 'member', true),
  (8, 17, 'member', true),
  (9, 19, 'member', true),
  (10, 21, 'member', true),
  (11, 22, 'member', true),
  (12, 24, 'member', true),
  (13, 1, 'member', true),
  (13, 7, 'member', true),
  (14, 3, 'member', true),
  (15, 4, 'member', true),
  (16, 5, 'member', true),
  (17, 6, 'member', true),
  (18, 2, 'member', true),
  (19, 2, 'member', true),
  (20, 2, 'member', true)
ON CONFLICT (user_id, team_id) DO NOTHING;

INSERT INTO team_history (team_id, changed_by_user_id, action_type, changes, notes)
SELECT t.id, 1, 'created', '[]'::jsonb, 'Seeded by system seed script'
FROM teams t
WHERE NOT EXISTS (
  SELECT 1 FROM team_history th
  WHERE th.team_id = t.id AND th.action_type = 'created'
);

INSERT INTO user_history (user_id, changed_by_user_id, action_type, changes, notes)
SELECT u.id, 1, 'created', '[]'::jsonb, 'Seeded by system seed script'
FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM user_history uh
  WHERE uh.user_id = u.id AND uh.action_type = 'created'
);

INSERT INTO team_permissions (team_id, permission_id)
SELECT u.team_id, p.id
FROM (VALUES (1), (2), (3), (4), (5), (6), (7), (8)) AS u(team_id)
CROSS JOIN permissions p
WHERE p.key IN ('activities.lookAhead.view')
ON CONFLICT (team_id, permission_id) DO NOTHING;

INSERT INTO team_permissions (team_id, permission_id)
SELECT 2, p.id
FROM permissions p
WHERE p.key IN ('activities.lookAhead.edit')
ON CONFLICT (team_id, permission_id) DO NOTHING;