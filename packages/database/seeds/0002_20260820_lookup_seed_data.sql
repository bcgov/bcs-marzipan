-- ============================================================================
-- ORGANIZATION TYPES (required before organizations.organization_type_id)
-- ============================================================================

INSERT INTO organization_types (id, uuid, name, display_name, sort_order, is_active, created_by, last_updated_by) VALUES
  (1, 'a1000001-0000-4000-8000-000000000001', 'ministry', 'Ministry', 1, true, 1, 1),
  (2, 'a1000002-0000-4000-8000-000000000002', 'agency', 'Agency', 2, true, 1, 1),
  (3, 'a1000003-0000-4000-8000-000000000003', 'board_commission_council', 'Board / Commission / Council', 3, true, 1, 1),
  (4, 'a1000004-0000-4000-8000-000000000004', 'crown_corporation', 'Crown Corporation', 4, true, 1, 1),
  (5, 'a1000005-0000-4000-8000-000000000005', 'health_authority', 'Health Authority', 5, true, 1, 1),
  (6, 'a1000006-0000-4000-8000-000000000006', 'tribunal', 'Tribunal', 6, true, 1, 1),
  (7, 'a1000007-0000-4000-8000-000000000007', 'other', 'Other', 7, true, 1, 1)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- ORGANIZATIONS (ministry catalog rows; extension in ministries)
-- Ids 1–20. MUST be seeded before ministries extension and government_representatives.
-- ============================================================================

INSERT INTO organizations (id, name, display_name, abbreviation, organization_type_id, jurisdiction, is_active, sort_order, created_by, last_updated_by) VALUES
  (1, 'PREM', 'Office of the Premier', 'PREM', 1, 'bcgov', true, 1, 1, 1),
  (2, 'IGRS', 'Intergovernmental Relations Secretariat', 'IGRS', 1, 'bcgov', true, 2, 1, 1),
  (3, 'AGRI', 'Agriculture', 'AGRI', 1, 'bcgov', true, 3, 1, 1),
  (4, 'AG', 'Attorney General', 'AG', 1, 'bcgov', true, 4, 1, 1),
  (5, 'CFD', 'Children and Family Development', 'CFD', 1, 'bcgov', true, 5, 1, 1),
  (6, 'CITZ', 'Citizens'' Services and Technology', 'CITZ', 1, 'bcgov', true, 6, 1, 1),
  (7, 'ECON', 'Economic Development and Tourism', 'ECON', 1, 'bcgov', true, 7, 1, 1),
  (8, 'ECC', 'Education and Child Care', 'ECC', 1, 'bcgov', true, 8, 1, 1),
  (9, 'EMPR', 'Energy, Mines and Petroleum Resources', 'EMPR', 1, 'bcgov', true, 9, 1, 1),
  (10, 'ENV', 'Environment', 'ENV', 1, 'bcgov', true, 10, 1, 1),
  (11, 'FIN', 'Finance', 'FIN', 1, 'bcgov', true, 11, 1, 1),
  (12, 'FOR', 'Forests', 'FOR', 1, 'bcgov', true, 12, 1, 1),
  (13, 'HLTH', 'Health', 'HLTH', 1, 'bcgov', true, 13, 1, 1),
  (14, 'IRR', 'Indigenous Relations and Reconciliation', 'IRR', 1, 'bcgov', true, 14, 1, 1),
  (15, 'LOCL', 'Local Government, Housing, Sport and Culture', 'LOCL', 1, 'bcgov', true, 15, 1, 1),
  (16, 'PSEL', 'Post-Secondary Education and Labour', 'PSEL', 1, 'bcgov', true, 16, 1, 1),
  (17, 'PSSG', 'Public Safety and Solicitor General', 'PSSG', 1, 'bcgov', true, 17, 1, 1),
  (18, 'SDEV', 'Social Development', 'SDEV', 1, 'bcgov', true, 18, 1, 1),
  (19, 'MOTI', 'Transportation and Infrastructure', 'MOTI', 1, 'bcgov', true, 19, 1, 1),
  (20, 'WLRO', 'Water, Land and Natural Resource Operations', 'WLRO', 1, 'bcgov', true, 20, 1, 1)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- ORGANIZATIONS (ABC / non-ministry catalog)
-- Ids 21+; ministries remain 1–20.
-- ============================================================================

INSERT INTO organizations (id, name, display_name, abbreviation, organization_type_id, jurisdiction, is_active, sort_order, created_by, last_updated_by) VALUES
  (21, 'BC Hydro', 'BC Hydro and Power Authority', NULL, 4, 'bcgov', true, 21, 1, 1),
  (22, 'ICBC', 'Insurance Corporation of British Columbia', 'ICBC', 4, 'bcgov', true, 22, 1, 1),
  (23, 'BCLC', 'British Columbia Lottery Corporation', 'BCLC', 4, 'bcgov', true, 23, 1, 1),
  (24, 'BC Transit', 'BC Transit', NULL, 4, 'bcgov', true, 24, 1, 1),
  (25, 'BC Housing', 'BC Housing Management Commission', NULL, 4, 'bcgov', true, 25, 1, 1),
  (26, 'Dest BC', 'Destination British Columbia Corp.', NULL, 4, 'bcgov', true, 26, 1, 1),
  (27, 'CLBC', 'Community Living British Columbia', NULL, 4, 'bcgov', true, 27, 1, 1),
  (28, 'BCSC', 'British Columbia Securities Commission', 'BCSC', 4, 'bcgov', true, 28, 1, 1),
  (29, 'BC Assessment', 'British Columbia Assessment Authority', NULL, 4, 'bcgov', true, 29, 1, 1),
  (30, 'Legal Aid BC', 'Legal Aid BC', NULL, 4, 'bcgov', true, 30, 1, 1),
  (31, 'RBCM', 'Royal BC Museum', 'RBCM', 4, 'bcgov', true, 31, 1, 1),
  (32, 'Knowledge Network', 'Knowledge Network Corporation', NULL, 4, 'bcgov', true, 32, 1, 1),
  (33, 'Innovate BC', 'Innovate BC', NULL, 4, 'bcgov', true, 33, 1, 1),
  (34, 'SkilledTradesBC', 'SkilledTradesBC', NULL, 4, 'bcgov', true, 34, 1, 1),
  (35, 'FHA', 'Fraser Health Authority', 'FHA', 5, 'bcgov', true, 35, 1, 1),
  (36, 'IHA', 'Interior Health Authority', 'IHA', 5, 'bcgov', true, 36, 1, 1),
  (37, 'NHA', 'Northern Health Authority', 'NHA', 5, 'bcgov', true, 37, 1, 1),
  (38, 'VCH', 'Vancouver Coastal Health Authority', 'VCH', 5, 'bcgov', true, 38, 1, 1),
  (39, 'VIHA', 'Vancouver Island Health Authority', 'VIHA', 5, 'bcgov', true, 39, 1, 1),
  (40, 'PHSA', 'Provincial Health Services Authority', 'PHSA', 5, 'bcgov', true, 40, 1, 1),
  (41, 'FNHA', 'First Nations Health Authority', 'FNHA', 5, 'bcgov', true, 41, 1, 1),
  (42, 'BCCS', 'BC Coroners Service', 'BCCS', 2, 'bcgov', true, 42, 1, 1),
  (43, 'CRT', 'Civil Resolution Tribunal', 'CRT', 6, 'bcgov', true, 43, 1, 1),
  (44, 'BCHRT', 'BC Human Rights Tribunal', 'BCHRT', 6, 'bcgov', true, 44, 1, 1),
  (45, 'BCUC', 'BC Utilities Commission', 'BCUC', 6, 'bcgov', true, 45, 1, 1),
  (46, 'BCER', 'BC Energy Regulator', 'BCER', 2, 'bcgov', true, 46, 1, 1),
  (47, 'BCAC', 'BC Arts Council', 'BCAC', 3, 'bcgov', true, 47, 1, 1),
  (48, 'FPCC', 'First Peoples'' Cultural Council', 'FPCC', 3, 'bcgov', true, 48, 1, 1),
  (49, 'CBT', 'Columbia Basin Trust', 'CBT', 7, 'bcgov', true, 49, 1, 1)
ON CONFLICT (id) DO NOTHING;

-- Federal departments (catalog orgs for joint/federal release scenarios)
INSERT INTO organizations (id, name, display_name, abbreviation, organization_type_id, jurisdiction, is_active, sort_order, created_by, last_updated_by) VALUES
  (50, 'Health Canada', 'Health Canada', 'HC', 2, 'federal', true, 50, 1, 1),
  (51, 'Department of Justice Canada', 'Department of Justice Canada', 'DOJ', 2, 'federal', true, 51, 1, 1),
  (52, 'Veterans Affairs Canada', 'Veterans Affairs Canada', 'VAC', 2, 'federal', true, 52, 1, 1),
  (53, 'Housing Infrastructure and Communities Canada', 'Housing, Infrastructure and Communities Canada', 'HICC', 2, 'federal', true, 53, 1, 1),
  (54, 'Employment and Social Development Canada', 'Employment and Social Development Canada', 'ESDC', 2, 'federal', true, 54, 1, 1),
  (55, 'Natural Resources Canada', 'Natural Resources Canada', 'NRCan', 2, 'federal', true, 55, 1, 1),
  (56, 'Indigenous Services Canada', 'Indigenous Services Canada', 'ISC', 2, 'federal', true, 56, 1, 1),
  (57, 'Innovation Science and Economic Development Canada', 'Innovation, Science and Economic Development Canada', 'ISED', 2, 'federal', true, 57, 1, 1)
ON CONFLICT (id) DO NOTHING;

-- Local government examples
INSERT INTO organizations (id, name, display_name, abbreviation, organization_type_id, jurisdiction, is_active, sort_order, created_by, last_updated_by) VALUES
  (58, 'City of Vancouver', 'City of Vancouver', 'Van', 7, 'local_government', true, 58, 1, 1),
  (59, 'Capital Regional District', 'Capital Regional District', 'CRD', 7, 'local_government', true, 59, 1, 1)
ON CONFLICT (id) DO NOTHING;

-- Ministry extension rows (shared id with organizations)
INSERT INTO ministries (id, created_by, last_updated_by) VALUES
  (1, 1, 1),
  (2, 1, 1),
  (3, 1, 1),
  (4, 1, 1),
  (5, 1, 1),
  (6, 1, 1),
  (7, 1, 1),
  (8, 1, 1),
  (9, 1, 1),
  (10, 1, 1),
  (11, 1, 1),
  (12, 1, 1),
  (13, 1, 1),
  (14, 1, 1),
  (15, 1, 1),
  (16, 1, 1),
  (17, 1, 1),
  (18, 1, 1),
  (19, 1, 1),
  (20, 1, 1)
ON CONFLICT (id) DO NOTHING;

-- Ministry quick-share groups (see config-data/0003_ministry_quick_share.sql)
-- Social: AG, CFD, CITZ, ECC, HLTH, IRR, PSEL, PSSG, SDEV
-- Resource: AGRI, EMPR, ENV, FOR, WLRO
-- Economic: FIN, LOCL, MOTI, ECON
-- PREM and IGRS: ungrouped
UPDATE ministries SET ministry_group_id = 1 WHERE id IN (4, 5, 6, 8, 13, 14, 16, 17, 18)
  AND ministry_group_id IS DISTINCT FROM 1;

UPDATE ministries SET ministry_group_id = 2 WHERE id IN (3, 9, 10, 12, 20)
  AND ministry_group_id IS DISTINCT FROM 2;

UPDATE ministries SET ministry_group_id = 3 WHERE id IN (11, 15, 19, 7)
  AND ministry_group_id IS DISTINCT FROM 3;

-- ============================================================================
-- GOVERNMENT REPRESENTATIVES
-- ============================================================================

INSERT INTO government_representatives (id, name, display_name, sort_order, is_active, title, representative_type, created_by, last_updated_by) VALUES
  (1000, 'Lorne Doerkson', 'Premier Lorne Doerkson', 1, true, 'Premier of British Columbia', 'premier', 1, 1)
ON CONFLICT (id) DO UPDATE
  SET name = EXCLUDED.name,
      display_name = EXCLUDED.display_name,
      sort_order = EXCLUDED.sort_order,
      is_active = EXCLUDED.is_active,
      title = EXCLUDED.title,
      representative_type = EXCLUDED.representative_type,
      last_updated_by = EXCLUDED.last_updated_by;

-- Ministers (rep id 2000 + ministry id for ids 3–20)
INSERT INTO government_representatives (id, name, display_name, sort_order, is_active, title, representative_type, created_by, last_updated_by) VALUES
  (2003, 'Ian Paton', 'Minister Ian Paton', 3, true, 'Minister of Agriculture', 'minister', 1, 1),
  (2004, 'Caroline Elliott', 'Attorney General Caroline Elliott', 4, true, 'Attorney General', 'minister', 1, 1),
  (2005, 'Kristina Loewen', 'Minister Kristina Loewen', 5, true, 'Minister of Children and Family Development', 'minister', 1, 1),
  (2006, 'Bruce Banman', 'Minister Bruce Banman', 6, true, 'Minister of Citizens'' Services and Technology', 'minister', 1, 1),
  (2007, 'Gavin Dew', 'Minister Gavin Dew', 7, true, 'Minister of Economic Development and Tourism', 'minister', 1, 1),
  (2008, 'Lynne Block', 'Minister Lynne Block', 8, true, 'Minister of Education and Child Care', 'minister', 1, 1),
  (2009, 'Larry Neufeld', 'Minister Larry Neufeld', 9, true, 'Minister of Energy, Mines and Petroleum Resources', 'minister', 1, 1),
  (2010, 'Áʼa:líya Warbus', 'Minister Áʼa:líya Warbus', 10, true, 'Minister of Environment', 'minister', 1, 1),
  (2011, 'Peter Milobar', 'Minister Peter Milobar', 11, true, 'Minister of Finance', 'minister', 1, 1),
  (2012, 'Kiel Giddens', 'Minister Kiel Giddens', 12, true, 'Minister of Forests', 'minister', 1, 1),
  (2013, 'Ryan Peterson', 'Minister Ryan Peterson', 13, true, 'Minister of Health', 'minister', 1, 1),
  (2014, 'Scott McInnis', 'Minister Scott McInnis', 14, true, 'Minister of Indigenous Relations and Reconciliation', 'minister', 1, 1),
  (2015, 'Cathie Ounsted', 'Minister Cathie Ounsted', 15, true, 'Minister of Local Government, Housing, Sport and Culture', 'minister', 1, 1),
  (2016, 'Korky Neufeld', 'Minister Korky Neufeld', 16, true, 'Minister of Post-Secondary Education and Labour', 'minister', 1, 1),
  (2017, 'Jessy Sahota', 'Minister Jessy Sahota', 17, true, 'Minister of Public Safety and Solicitor General', 'minister', 1, 1),
  (2018, 'Claire Rattée', 'Minister Claire Rattée', 18, true, 'Minister of Social Development and Deputy Premier', 'minister', 1, 1),
  (2019, 'Trevor Halford', 'Minister Trevor Halford', 19, true, 'Minister of Transportation and Infrastructure', 'minister', 1, 1),
  (2020, 'Donegal Wilson', 'Minister Donegal Wilson', 20, true, 'Minister of Water, Land and Natural Resource Operations', 'minister', 1, 1)
ON CONFLICT (id) DO UPDATE
  SET name = EXCLUDED.name,
      display_name = EXCLUDED.display_name,
      sort_order = EXCLUDED.sort_order,
      is_active = EXCLUDED.is_active,
      title = EXCLUDED.title,
      representative_type = EXCLUDED.representative_type,
      last_updated_by = EXCLUDED.last_updated_by;

-- Ministers of state
INSERT INTO government_representatives (id, name, display_name, sort_order, is_active, title, representative_type, created_by, last_updated_by) VALUES
  (2101, 'Carson Binda', 'Minister of State Carson Binda', 21, true, 'Minister of State for Red Tape Reduction', 'minister_of_state', 1, 1),
  (2102, 'Anna Kindy', 'Minister of State Anna Kindy', 22, true, 'Minister of State for Rural Development', 'minister_of_state', 1, 1),
  (2103, 'Pete Davis', 'Minister of State Pete Davis', 23, true, 'Minister of State for Mining', 'minister_of_state', 1, 1),
  (2104, 'Zeeshan Wahla', 'Minister of State Zeeshan Wahla', 24, true, 'Minister of State for Housing', 'minister_of_state', 1, 1),
  (2105, 'Harman Bhangu', 'Minister of State Harman Bhangu', 25, true, 'Minister of State for Labour', 'minister_of_state', 1, 1),
  (2106, 'Ward Stamer', 'Minister of State Ward Stamer', 26, true, 'Minister of State for Emergency Management', 'minister_of_state', 1, 1)
ON CONFLICT (id) DO UPDATE
  SET name = EXCLUDED.name,
      display_name = EXCLUDED.display_name,
      sort_order = EXCLUDED.sort_order,
      is_active = EXCLUDED.is_active,
      title = EXCLUDED.title,
      representative_type = EXCLUDED.representative_type,
      last_updated_by = EXCLUDED.last_updated_by;

-- Non-cabinet MLAs
INSERT INTO government_representatives (id, name, display_name, sort_order, is_active, title, representative_type, created_by, last_updated_by) VALUES
  (2201, 'Darryl Kropp', 'MLA Darryl Kropp', 31, true, 'MLA', 'mla', 1, 1),
  (2202, 'Heather Maahs', 'MLA Heather Maahs', 32, true, 'MLA', 'mla', 1, 1),
  (2203, 'Matt Liang', 'MLA Matt Liang', 33, true, 'MLA', 'mla', 1, 1),
  (2204, 'Monica Mohan', 'MLA Monica Mohan', 34, true, 'MLA', 'mla', 1, 1),
  (2205, 'Tony Luck', 'MLA Tony Luck', 35, true, 'MLA', 'mla', 1, 1),
  (2206, 'Mike Hicks', 'MLA Mike Hicks', 36, true, 'MLA', 'mla', 1, 1),
  (2207, 'Lawrence Mok', 'MLA Lawrence Mok', 37, true, 'MLA', 'mla', 1, 1),
  (2208, 'Doug Morneau', 'MLA Doug Morneau', 38, true, 'MLA', 'mla', 1, 1),
  (2209, 'Curtis Whitford', 'MLA Curtis Whitford', 39, true, 'MLA', 'mla', 1, 1),
  (2210, 'John McEwen', 'MLA John McEwen', 40, true, 'MLA', 'mla', 1, 1),
  (2211, 'Sheldon Clare', 'MLA Sheldon Clare', 41, true, 'MLA', 'mla', 1, 1),
  (2212, 'David Williams', 'MLA David Williams', 42, true, 'MLA', 'mla', 1, 1),
  (2213, 'Garry Thind', 'MLA Garry Thind', 43, true, 'MLA', 'mla', 1, 1)
ON CONFLICT (id) DO UPDATE
  SET name = EXCLUDED.name,
      display_name = EXCLUDED.display_name,
      sort_order = EXCLUDED.sort_order,
      is_active = EXCLUDED.is_active,
      title = EXCLUDED.title,
      representative_type = EXCLUDED.representative_type,
      last_updated_by = EXCLUDED.last_updated_by;

-- Designated minister per ministry
UPDATE ministries SET minister_government_rep_id = 1000 WHERE id = 1;
UPDATE ministries SET minister_government_rep_id = NULL WHERE id = 2;
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
UPDATE ministries SET minister_government_rep_id = 2016 WHERE id = 16;
UPDATE ministries SET minister_government_rep_id = 2017 WHERE id = 17;
UPDATE ministries SET minister_government_rep_id = 2018 WHERE id = 18;
UPDATE ministries SET minister_government_rep_id = 2019 WHERE id = 19;
UPDATE ministries SET minister_government_rep_id = 2020 WHERE id = 20;

-- ============================================================================
-- TAGS
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