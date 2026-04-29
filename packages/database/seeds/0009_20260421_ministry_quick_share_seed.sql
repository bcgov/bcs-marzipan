-- Ministry groups for activity "Shared with teams" shortcuts (depends on users id=999; see 0007 completion permission seed / CALENDAR_SYSTEM_USER_ID)
-- Social: CITZ, AG, MCFD, ECC, HLTH, IRR, PSFS, PSSG, SDPR, TACS
-- Resource: AF, EMCR, ECS, ENV, FOR, MIN, WLRS
-- Economical: FIN, HMA, INF, JEG, LRB, MOTT

INSERT INTO ministry_groups (id, name, sort_order, created_by, last_updated_by)
VALUES
  (1, 'Social', 0, 999, 999),
  (2, 'Resource', 1, 999, 999),
  (3, 'Economic', 2, 999, 999)
ON CONFLICT (id) DO NOTHING;

-- Safe for incremental re-seed: only sets canonical mapping when the row differs.
UPDATE ministries SET ministry_group_id = 1 WHERE id IN (
  5, 3, 4, 6, 12, 14, 20, 21, 22, 23
) AND ministry_group_id IS DISTINCT FROM 1;

UPDATE ministries SET ministry_group_id = 2 WHERE id IN (
  2, 7, 8, 9, 11, 19, 25
) AND ministry_group_id IS DISTINCT FROM 2;

UPDATE ministries SET ministry_group_id = 3 WHERE id IN (
  10, 13, 15, 17, 18, 24
) AND ministry_group_id IS DISTINCT FROM 3;
