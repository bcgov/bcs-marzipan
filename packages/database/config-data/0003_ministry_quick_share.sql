-- Ministry groups for activity "Shared with teams" shortcuts (depends on users id=999; see 0000_roles_permissions.sql / CALENDAR_SYSTEM_USER_ID)
-- Social: CITZ, AG, MCFD, ECC, HLTH, IRR, PSFS, PSSG, SDPR, TACS
-- Resource: AF, EMCR, ECS, ENV, FOR, MIN, WLRS
-- Economical: FIN, HMA, INF, JEG, LRB, MOTT

INSERT INTO ministry_groups (id, name, sort_order, created_by, last_updated_by)
VALUES
  (1, 'Social', 0, 999, 999),
  (2, 'Resource', 1, 999, 999),
  (3, 'Economic', 2, 999, 999)
ON CONFLICT (id) DO NOTHING;
