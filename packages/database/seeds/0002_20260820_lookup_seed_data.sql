-- ============================================================================
-- MINISTRIES
-- Government departments
-- Legacy: used UUID primary key. Now uses serial (integer) id.
-- MUST be seeded before government_representatives as they reference ministries
-- abbreviation: varchar(5), used in activity displayId prefix (with lead ministry)
-- ============================================================================

INSERT INTO ministries (id, sort_order, is_active, name, display_name, abbreviation, created_by, last_updated_by) VALUES
  (1, 1, true, 'PREM', 'Office of the Premier', 'PREM', 1, 1),
  (2, 2, true, 'AF', 'Agriculture and Food', 'AF', 1, 1),
  (3, 3, true, 'AG', 'Attorney General', 'AG', 1, 1),
  (4, 4, true, 'MCFD', 'Children and Family Development', 'MCFD', 1, 1),
  (5, 5, true, 'CITZ', 'Citizens'' Services', 'CITZ', 1, 1),
  (6, 6, true, 'ECC', 'Education and Child Care', 'ECC', 1, 1),
  (7, 7, true, 'EMCR', 'Emergency Management and Climate Readiness', 'EMCR', 1, 1),
  (8, 8, true, 'ECS', 'Energy and Climate Solutions', 'ECS', 1, 1),
  (9, 9, true, 'ENV', 'Environment and Parks', 'ENV', 1, 1),
  (10, 10, true, 'FIN', 'Finance', 'FIN', 1, 1),
  (11, 11, true, 'FOR', 'Forests', 'FOR', 1, 1),
  (12, 12, true, 'HLTH', 'Health', 'HLTH', 1, 1),
  (13, 13, true, 'HMA', 'Housing and Municipal Affairs', 'HMA', 1, 1),
  (14, 14, true, 'IRR', 'Indigenous Relations and Reconciliation', 'IRR', 1, 1),
  (15, 15, true, 'INF', 'Infrastructure', 'INF', 1, 1),
  (16, 16, true, 'IGRS', 'Intergovernmental Relations Secretariat', 'IGRS', 1, 1),
  (17, 17, true, 'JEG', 'Jobs and Economic Growth', 'JEG', 1, 1),
  (18, 18, true, 'LRB', 'Labour', 'LRB', 1, 1),
  (19, 19, true, 'MIN', 'Mining and Critical Minerals', 'MIN', 1, 1),
  (20, 20, true, 'PSFS', 'Post-Secondary Education and Future Skills', 'PSFS', 1, 1),
  (21, 21, true, 'PSSG', 'Public Safety and Solicitor General', 'PSSG', 1, 1),
  (22, 22, true, 'SDPR', 'Social Development and Poverty Reduction', 'SDPR', 1, 1),
  (23, 23, true, 'TACS', 'Tourism, Arts, Culture and Sport', 'TACS', 1, 1),
  (24, 24, true, 'TT', 'Transportation and Transit', 'TT', 1, 1),
  (25, 25, true, 'WLRS', 'Water, Land and Resource Stewardship', 'WLRS', 1, 1)
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
-- ============================================================================
-- ORGANIZATIONS
-- Organizations (superset of ministries)
-- Legacy: used UUID primary key. Now uses serial (integer) id.
-- Links to ministries where applicable (BC government ministries)
-- ============================================================================

INSERT INTO organizations (id, name, display_name, organization_type, ministry_id, is_active, sort_order, created_by, last_updated_by) VALUES
  (1, 'PREM', 'Office of the Premier', 'bcgov', 1, true, 1, 1, 1),
  (2, 'AF', 'Agriculture and Food', 'bcgov', 2, true, 2, 1, 1),
  (3, 'AG', 'Attorney General', 'bcgov', 3, true, 3, 1, 1),
  (4, 'MCFD', 'Children and Family Development', 'bcgov', 4, true, 4, 1, 1),
  (5, 'CITZ', 'Citizens'' Services', 'bcgov', 5, true, 5, 1, 1),
  (6, 'ECC', 'Education and Child Care', 'bcgov', 6, true, 6, 1, 1),
  (7, 'EMCR', 'Emergency Management and Climate Readiness', 'bcgov', 7, true, 7, 1, 1),
  (8, 'ECS', 'Energy and Climate Solutions', 'bcgov', 8, true, 8, 1, 1),
  (9, 'ENV', 'Environment and Parks', 'bcgov', 9, true, 9, 1, 1),
  (10, 'FIN', 'Finance', 'bcgov', 10, true, 10, 1, 1),
  (11, 'FOR', 'Forests', 'bcgov', 11, true, 11, 1, 1),
  (12, 'HLTH', 'Health', 'bcgov', 12, true, 12, 1, 1),
  (13, 'HMA', 'Housing and Municipal Affairs', 'bcgov', 13, true, 13, 1, 1),
  (14, 'IRR', 'Indigenous Relations and Reconciliation', 'bcgov', 14, true, 14, 1, 1),
  (15, 'INF', 'Infrastructure', 'bcgov', 15, true, 15, 1, 1),
  (16, 'IGRS', 'Intergovernmental Relations Secretariat', 'bcgov', 16, true, 16, 1, 1),
  (17, 'JEG', 'Jobs and Economic Growth', 'bcgov', 17, true, 17, 1, 1),
  (18, 'LRB', 'Labour', 'bcgov', 18, true, 18, 1, 1),
  (19, 'MIN', 'Mining and Critical Minerals', 'bcgov', 19, true, 19, 1, 1),
  (20, 'PSFS', 'Post-Secondary Education and Future Skills', 'bcgov', 20, true, 20, 1, 1),
  (21, 'PSSG', 'Public Safety and Solicitor General', 'bcgov', 21, true, 21, 1, 1),
  (22, 'SDPR', 'Social Development and Poverty Reduction', 'bcgov', 22, true, 22, 1, 1),
  (23, 'TACS', 'Tourism, Arts, Culture and Sport', 'bcgov', 23, true, 23, 1, 1),
  (24, 'MOTT', 'Transportation and Transit', 'bcgov', 24, true, 24, 1, 1),
  (25, 'WLRS', 'Water, Land and Resource Stewardship', 'bcgov', 25, true, 25, 1, 1)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- GOVERNMENT REPRESENTATIVES
-- Representatives for activities
-- ============================================================================

-- PREMIER (portfolio link is ministries.minister_government_rep_id, not on this row)
INSERT INTO government_representatives (id, name, display_name, sort_order, is_active, title, representative_type, created_by, last_updated_by) VALUES
  (1000, 'David Eby', 'Premier David Eby', 1, true, 'Premier of British Columbia', 'premier', 1, 1)
ON CONFLICT (id) DO UPDATE
  SET name = EXCLUDED.name,
      display_name = EXCLUDED.display_name,
      sort_order = EXCLUDED.sort_order,
      is_active = EXCLUDED.is_active,
      title = EXCLUDED.title,
      representative_type = EXCLUDED.representative_type,
      created_by = EXCLUDED.created_by,
      last_updated_by = EXCLUDED.last_updated_by;

-- MINISTERS
INSERT INTO government_representatives (id, name, display_name, sort_order, is_active, title, representative_type, created_by, last_updated_by) VALUES
  (2002, 'Lana Popham', 'Minister Lana Popham', 2, true, 'Minister of Agriculture and Food', 'minister', 1, 1),
  (2003, 'Niki Sharma', 'Attorney General Niki Sharma', 3, true, 'Attorney General and Deputy Premier', 'minister', 1, 1),
  (2004, 'Jodie Wickens', 'Minister Jodie Wickens', 4, true, 'Minister of Children and Family Development', 'minister', 1, 1),
  (2005, 'Diana Gibson', 'Minister Diana Gibson', 5, true, 'Minister of Citizens'' Services', 'minister', 1, 1),
  (2006, 'Lisa Beare', 'Minister Lisa Beare', 6, true, 'Minister of Education and Child Care', 'minister', 1, 1),
  (2007, 'Kelly Greene', 'Minister Kelly Greene', 7, true, 'Minister of Emergency Management and Climate Readiness', 'minister', 1, 1),
  (2008, 'Adrian Dix', 'Minister Adrian Dix', 8, true, 'Minister of Energy and Climate Solutions', 'minister', 1, 1),
  (2009, 'Tamara Davidson', 'Minister Tamara Davidson', 9, true, 'Minister of Environment and Parks', 'minister', 1, 1),
  (2010, 'Brenda Bailey', 'Minister Brenda Bailey', 10, true, 'Minister of Finance', 'minister', 1, 1),
  (2011, 'Ravi Parmar', 'Minister Ravi Parmar', 11, true, 'Minister of Forests', 'minister', 1, 1),
  (2012, 'Josie Osborne', 'Minister Josie Osborne', 12, true, 'Minister of Health', 'minister', 1, 1),
  (2013, 'Christine Boyle', 'Minister Christine Boyle', 13, true, 'Minister of Housing and Municipal Affairs', 'minister', 1, 1),
  (2014, 'Spencer Chandra Herbert', 'Minister Spencer Chandra Herbert', 14, true, 'Minister of Indigenous Relations and Reconciliation', 'minister', 1, 1),
  (2015, 'Bowinn Ma', 'Minister Bowinn Ma', 15, true, 'Minister of Infrastructure', 'minister', 1, 1),
  (2017, 'Ravi Kahlon', 'Minister Ravi Kahlon', 17, true, 'Minister of Jobs and Economic Growth', 'minister', 1, 1),
  (2018, 'Jennifer Whiteside', 'Minister Jennifer Whiteside', 18, true, 'Minister of Labour', 'minister', 1, 1),
  (2019, 'Jagrup Brar', 'Minister Jagrup Brar', 19, true, 'Minister of Mining and Critical Minerals', 'minister', 1, 1),
  (2020, 'Jessie Sunner', 'Minister Jessie Sunner', 20, true, 'Minister of Post-Secondary Education and Future Skills', 'minister', 1, 1),
  (2021, 'Nina Krieger', 'Minister Nina Krieger', 21, true, 'Minister of Public Safety and Solicitor General', 'minister', 1, 1),
  (2022, 'Sheila Malcolmson', 'Minister Sheila Malcolmson', 22, true, 'Minister of Social Development and Poverty Reduction', 'minister', 1, 1),
  (2023, 'Anne Kang', 'Minister Anne Kang', 23, true, 'Minister of Tourism, Arts, Culture and Sport', 'minister', 1, 1),
  (2024, 'Mike Farnworth', 'Minister Mike Farnworth', 24, true, 'Minister of Transportation and Transit', 'minister', 1, 1),
  (2025, 'Randene Neill', 'Minister Randene Neill', 25, true, 'Minister of Water, Land and Resource Stewardship', 'minister', 1, 1)
ON CONFLICT (id) DO UPDATE
  SET name = EXCLUDED.name,
      display_name = EXCLUDED.display_name,
      sort_order = EXCLUDED.sort_order,
      is_active = EXCLUDED.is_active,
      title = EXCLUDED.title,
      representative_type = EXCLUDED.representative_type,
      created_by = EXCLUDED.created_by,
      last_updated_by = EXCLUDED.last_updated_by;

-- Designated minister per ministry (source of truth on ministries row)
UPDATE ministries SET minister_government_rep_id = 1000 WHERE id = 1;
UPDATE ministries SET minister_government_rep_id = 2002 WHERE id = 2;
UPDATE ministries SET minister_government_rep_id = 2003 WHERE id = 3;
UPDATE ministries SET minister_government_rep_id = 2004 WHERE id = 4;
UPDATE ministries SET minister_government_rep_id = 2005 WHERE id = 5;
UPDATE ministries SET minister_government_rep_id = 2006 WHERE id = 6;
UPDATE ministries SET minister_government_rep_id = 2007 WHERE id = 7;
UPDATE ministries SET minister_government_rep_id = 2008 WHERE id = 8;
UPDATE ministries SET minister_government_rep_id = 2009 WHERE id = 9;
UPDATE ministries SET minister_government_rep_id = 2010 WHERE id = 10;
UPDATE ministries SET minister_government_rep_id = 2011 WHERE id = 11;
UPDATE ministries SET minister_government_rep_id = 2012 WHERE id = 12;
UPDATE ministries SET minister_government_rep_id = 2013 WHERE id = 13;
UPDATE ministries SET minister_government_rep_id = 2014 WHERE id = 14;
UPDATE ministries SET minister_government_rep_id = 2015 WHERE id = 15;
UPDATE ministries SET minister_government_rep_id = 2017 WHERE id = 17;
UPDATE ministries SET minister_government_rep_id = 2018 WHERE id = 18;
UPDATE ministries SET minister_government_rep_id = 2019 WHERE id = 19;
UPDATE ministries SET minister_government_rep_id = 2020 WHERE id = 20;
UPDATE ministries SET minister_government_rep_id = 2021 WHERE id = 21;
UPDATE ministries SET minister_government_rep_id = 2022 WHERE id = 22;
UPDATE ministries SET minister_government_rep_id = 2023 WHERE id = 23;
UPDATE ministries SET minister_government_rep_id = 2024 WHERE id = 24;
UPDATE ministries SET minister_government_rep_id = 2025 WHERE id = 25;

-- ============================================================================
-- TAGS
-- Tags teams can apply to activities; currently limited to use by admin
-- Updated with new values
-- ============================================================================

INSERT INTO tags (id, name, display_name, sort_order, visibility, is_active, description, created_by, last_updated_by) VALUES
  (1, 'HQ-EV', 'HQ-EV', 1, 'global', true, 'CCHQ tag for admin use only', 1, 1),
  (2, 'HQ-ECO', 'HQ-ECO', 2, 'global', true, 'CCHQ tag for admin use only', 1, 1),
  (3, 'HQ-PR', 'HQ-PR', 3, 'global', true, 'CCHQ tag for admin use only', 1, 1),
  (4, 'HQ-1P', 'HQ-1P', 4, 'global', true, 'CCHQ tag for admin use only', 1, 1),
  (5, 'HQ-2PT', 'HQ-2PT', 5, 'global', true, 'CCHQ tag for admin use only', 1, 1),
  (6, 'HQ-3S', 'HQ-3S', 6, 'global', true, 'CCHQ tag for admin use only', 1, 1),
  (7, 'HQ-4W', 'HQ-4W', 7, 'global', true, 'CCHQ tag for admin use only', 1, 1),
  (8, 'CAS', 'CAS', 8, 'global', true, 'CCHQ tag for admin use only', 1, 1),
  (9, 'LWS', 'LWS', 9, 'global', true, 'CCHQ tag for admin use only', 1, 1)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- THEMES
-- Classification themes for activities
-- Legacy: used UUID primary key. Now uses serial (integer) id.
-- ============================================================================

INSERT INTO themes (id, name, display_name, sort_order, is_active, created_by, last_updated_by) VALUES
  (1, 'birth', 'Birth', 1, true, 1, 1),
  (2, 'adoption', 'Adoption', 2, true, 1, 1),
  (3, 'death', 'Death', 3, true, 1, 1),
  (4, 'marriage and divorce', 'Marriage and Divorce', 4, true, 1, 1),
  (5, 'british columbians and our governments', 'British Columbians and Our Governments', 5, true, 1, 1),
  (6, 'driving and transportation', 'Driving and Transportation', 6, true, 1, 1),
  (7, 'education and training', 'Education and Training', 7, true, 1, 1),
  (8, 'employment business and economic development', 'Employment, Business and Economic Development', 8, true, 1, 1),
  (9, 'environmental protection and sustainability', 'Environmental Protection and Sustainability', 9, true, 1, 1),
  (10, 'family and social supports', 'Family and Social Supports', 10, true, 1, 1),
  (11, 'farming natural resources and industry', 'Farming, Natural Resources and Industry', 11, true, 1, 1),
  (12, 'health', 'Health', 12, true, 1, 1),
  (13, 'housing and tenancy', 'Housing and Tenancy', 13, true, 1, 1),
  (14, 'law crime and justice', 'Law, Crime and Justice', 14, true, 1, 1),
  (15, 'public safety and emergency services', 'Public Safety and Emergency Services', 15, true, 1, 1),
  (16, 'sports recreation arts and culture', 'Sports, Recreation, Arts and Culture', 16, true, 1, 1),
  (17, 'taxes and tax credits', 'Taxes and Tax Credits', 17, true, 1, 1),
  (18, 'tourism and immigration', 'Tourism and Immigration', 18, true, 1, 1)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- EVENT PLANNERS
-- Event planners for activities
-- ============================================================================

INSERT INTO event_planners (id, name, display_name, sort_order, is_active, email, phone, created_by, last_updated_by) VALUES
  (1, 'Alex Morgan', 'Alex Morgan', 1, true, 'alex.morgan@gov.bc.ca', '250-555-0201', 1, 1),
  (2, 'Jordan Taylor', 'Jordan Taylor', 2, true, 'jordan.taylor@gov.bc.ca', '250-555-0202', 1, 1),
  (3, 'Casey Lee', 'Casey Lee', 3, true, 'casey.lee@gov.bc.ca', '250-555-0203', 1, 1),
  (4, 'Riley Chen', 'Riley Chen', 4, true, 'riley.chen@gov.bc.ca', '250-555-0204', 1, 1),
  (5, 'Morgan Peters', 'Morgan Peters', 5, true, 'morgan.peters@gov.bc.ca', '250-555-0205', 1, 1),
  (6, 'Avery Kim', 'Avery Kim', 6, true, 'avery.kim@gov.bc.ca', '250-555-0206', 1, 1),
  (7, 'Dakota Smith', 'Dakota Smith', 7, true, 'dakota.smith@gov.bc.ca', '250-555-0207', 1, 1)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- NEWS RELEASE ORIGINS
-- News release origins
-- Updated with new values
-- ============================================================================

INSERT INTO news_release_origins (id, name, display_name, sort_order, is_active, description, created_by, last_updated_by) VALUES
  (1, 'tbd', 'TBD', 1, true, 'News release origin to be determined', 1, 1),
  (2, 'ministry release', 'Ministry release', 2, true, 'News release originates from a ministry', 1, 1),
  (3, 'joint ministry 3rd party release', 'Joint ministry / 3rd party release', 3, true, 'Joint news release from ministry and third party', 1, 1),
  (4, 'joint ministry federal release', 'Joint ministry / Federal release', 4, true, 'Joint news release from ministry and federal government', 1, 1),
  (5, 'local government release', 'Local government release', 5, true, 'News release from local government', 1, 1),
  (6, '3rd party release', '3rd party release', 6, true, 'News release from third party organization', 1, 1),
  (7, 'federal release', 'Federal release', 7, true, 'News release from federal government', 1, 1)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SECTORS
-- Government sectors
-- Uses UUID primary key
-- Updated with new values
-- ============================================================================

INSERT INTO sectors (id, name, display_name, sort_order, is_active, description, created_by, last_updated_by) VALUES
  ('00000000-0000-4000-8000-000000000301', 'agriculture', 'Agriculture', 1, true, 'Agriculture sector', 1, 1),
  ('00000000-0000-4000-8000-000000000302', 'cannabis', 'Cannabis', 2, true, 'Cannabis sector', 1, 1),
  ('00000000-0000-4000-8000-000000000303', 'clean technology', 'Clean Technology', 3, true, 'Clean Technology sector', 1, 1),
  ('00000000-0000-4000-8000-000000000304', 'construction', 'Construction', 4, true, 'Construction sector', 1, 1),
  ('00000000-0000-4000-8000-000000000305', 'film tv', 'Film & TV', 5, true, 'Film & TV sector', 1, 1),
  ('00000000-0000-4000-8000-000000000306', 'fisheries aquaculture', 'Fisheries & aquaculture', 6, true, 'Fisheries & aquaculture sector', 1, 1),
  ('00000000-0000-4000-8000-000000000307', 'forestry', 'Forestry', 7, true, 'Forestry sector', 1, 1),
  ('00000000-0000-4000-8000-000000000308', 'manufacturing', 'Manufacturing', 8, true, 'Manufacturing sector', 1, 1),
  ('00000000-0000-4000-8000-000000000309', 'mining', 'Mining', 9, true, 'Mining sector', 1, 1),
  ('00000000-0000-4000-8000-000000000310', 'technology innovation', 'Technology & innovation', 10, true, 'Technology & innovation sector', 1, 1),
  ('00000000-0000-4000-8000-000000000311', 'tourism', 'Tourism', 11, true, 'Tourism sector', 1, 1)
ON CONFLICT (id) DO NOTHING;
