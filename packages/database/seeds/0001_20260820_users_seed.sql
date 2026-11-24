-- IMPORTANT: Users must be seeded first as other tables reference them
-- via created_by and last_updated_by foreign keys

-- ============================================================================
-- USERS
-- Lean dev fixture set (20 users): Viewer, Editors, Advanced, Admin, System Admin
-- ============================================================================

INSERT INTO users (id, ad_username, ad_display_name, ad_email, ad_department, ad_job_title, role_id, is_active) VALUES
  -- View Only (role_id: 1)
  (1, 'jane.smith', 'Jane Smith', 'jane.smith@gov.bc.ca', 'GCPE', 'Public Affairs Officer', 1, true),
  -- Editors (role_id: 2)
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
  -- Advanced Editor (role_id: 4)
  (13, 'john.doe', 'John Doe', 'john.doe@gov.bc.ca', 'GCPE', 'Issues Manager', 4, true),
  (14, 'nadia.al-mansouri', 'Nadia Al-Mansouri', 'nadia.al-mansouri@gov.bc.ca', 'GCPE', 'Media Relations Officer', 4, true),
  (15, 'tendai.mbatha', 'Tendai Mbatha', 'tendai.mbatha@gov.bc.ca', 'GCPE', 'Digital Content Manager', 4, true),
  (16, 'linda.martin', 'Linda Martin', 'linda.martin@gov.bc.ca', 'GCPE', 'Events Manager', 4, true),
  (17, 'ahmed.rahman', 'Ahmed Rahman', 'ahmed.rahman@gov.bc.ca', 'GCPE', 'GCPE ADM', 4, true),
  -- Admin (role_id: 5)
  (18, 'thomas.garcia', 'Thomas Garcia', 'thomas.garcia@gov.bc.ca', 'GCPE', 'Corporate Calendar Manager', 5, true),
  (19, 'xiaoling.wang', 'Xiaoling Wang', 'xiaoling.wang@gov.bc.ca', 'GCPE', 'Corporate Calendar Manager', 5, true),
  -- System Admin (role_id: 6)
  (20, 'daniel.robinson', 'Daniel Robinson', 'daniel.robinson@gov.bc.ca', 'Business Communications Solutions', 'Business Communications Solutions', 6, true)
ON CONFLICT (id) DO NOTHING;