-- Fix the activities_id_seq sequence to be in sync with existing data
-- This sets the sequence to the maximum ID in the table + 1
SELECT setval('activities_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM activities), false);
