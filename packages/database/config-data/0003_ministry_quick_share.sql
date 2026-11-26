-- Ministry groups for activity "Shared with teams" shortcuts (depends on users id=999; see 0000_roles_permissions.sql / CALENDAR_SYSTEM_USER_ID)
-- Membership is set in seeds/0002_20260820_lookup_seed_data.sql
-- Social: AG, CFD, CITZ, ECC, HLTH, IRR, PSEL, PSSG, SDEV
-- Resource: AGRI, EMPR, ENV, FOR, WLRO
-- Economic: FIN, LOCL, MOTI, ECON
-- Ungrouped: PREM, IGRS

INSERT INTO ministry_groups (id, name, sort_order, created_by, last_updated_by)
VALUES
  (1, 'Social', 0, 999, 999),
  (2, 'Resource', 1, 999, 999),
  (3, 'Economic', 2, 999, 999)
ON CONFLICT (id) DO NOTHING;
