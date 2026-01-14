-- Fix sequences for lookup tables with serial IDs
-- This ensures auto-increment IDs continue from the maximum existing ID

-- Fix cities sequence
SELECT setval('cities_id_seq', COALESCE((SELECT MAX(id) FROM cities), 1), true);

-- Fix categories sequence
SELECT setval('categories_id_seq', COALESCE((SELECT MAX(id) FROM categories), 1), true);

-- Fix government_representatives sequence
SELECT setval('government_representatives_id_seq', COALESCE((SELECT MAX(id) FROM government_representatives), 1), true);

-- Fix comms_materials sequence
SELECT setval('comms_materials_id_seq', COALESCE((SELECT MAX(id) FROM comms_materials), 1), true);

-- Fix activity_statuses sequence
SELECT setval('activity_statuses_id_seq', COALESCE((SELECT MAX(id) FROM activity_statuses), 1), true);

-- Fix pitch_statuses sequence
SELECT setval('pitch_statuses_id_seq', COALESCE((SELECT MAX(id) FROM pitch_statuses), 1), true);

-- Fix scheduling_statuses sequence
SELECT setval('scheduling_statuses_id_seq', COALESCE((SELECT MAX(id) FROM scheduling_statuses), 1), true);

-- Fix translated_languages sequence
SELECT setval('translated_languages_id_seq', COALESCE((SELECT MAX(id) FROM translated_languages), 1), true);

-- Fix system_users sequence
SELECT setval('system_users_id_seq', COALESCE((SELECT MAX(id) FROM system_users), 1), true);

-- Fix activities sequence
SELECT setval('activities_id_seq', COALESCE((SELECT MAX(id) FROM activities), 1), true);
