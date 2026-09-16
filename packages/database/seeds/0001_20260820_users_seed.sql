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