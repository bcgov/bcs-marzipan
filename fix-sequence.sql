-- Fix all auto-increment sequences to be in sync with existing data
-- Run this SQL script directly in PostgreSQL to fix the ID conflict issues

-- Fix cities sequence
SELECT setval('cities_id_seq', (SELECT COALESCE(MAX(id), 0) FROM cities), true);

-- Fix categories sequence
SELECT setval('categories_id_seq', (SELECT COALESCE(MAX(id), 0) FROM categories), true);

-- Fix government_representatives sequence
SELECT setval('government_representatives_id_seq', (SELECT COALESCE(MAX(id), 0) FROM government_representatives), true);

-- Fix comms_materials sequence
SELECT setval('comms_materials_id_seq', (SELECT COALESCE(MAX(id), 0) FROM comms_materials), true);

-- Fix activity_statuses sequence
SELECT setval('activity_statuses_id_seq', (SELECT COALESCE(MAX(id), 0) FROM activity_statuses), true);

-- Fix pitch_statuses sequence
SELECT setval('pitch_statuses_id_seq', (SELECT COALESCE(MAX(id), 0) FROM pitch_statuses), true);

-- Fix scheduling_statuses sequence
SELECT setval('scheduling_statuses_id_seq', (SELECT COALESCE(MAX(id), 0) FROM scheduling_statuses), true);

-- Fix translated_languages sequence
SELECT setval('translated_languages_id_seq', (SELECT COALESCE(MAX(id), 0) FROM translated_languages), true);

-- Fix system_users sequence
SELECT setval('system_users_id_seq', (SELECT COALESCE(MAX(id), 0) FROM system_users), true);

-- Fix activities sequence
SELECT setval('activities_id_seq', (SELECT COALESCE(MAX(id), 0) FROM activities), true);
