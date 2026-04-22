-- Ministry groups for activity "Shared with teams" shortcuts (depends on users id=999; see 0008 completion permission seed / CALENDAR_SYSTEM_USER_ID)
-- Social: CITZ, AG, MCFD, ECC, HLTH, IRR, PSFS, PSSG, SDPR, TACS
-- Resource: AF, EMCR, ECS, ENV, FOR, MIN, WLRS
-- Economical: FIN, HMA, INF, JEG, LRB, MOTT

INSERT INTO ministry_groups (id, name, sort_order, created_by, last_updated_by)
VALUES
  (1, 'Social', 0, 999, 999),
  (2, 'Resource', 1, 999, 999),
  (3, 'Economical', 2, 999, 999)
ON CONFLICT (id) DO NOTHING;

UPDATE ministries SET ministry_group_id = 1 WHERE id IN (
  5, 3, 4, 6, 12, 14, 20, 21, 22, 23
);

UPDATE ministries SET ministry_group_id = 2 WHERE id IN (
  2, 7, 8, 9, 11, 19, 25
);

UPDATE ministries SET ministry_group_id = 3 WHERE id IN (
  10, 13, 15, 17, 18, 24
);
