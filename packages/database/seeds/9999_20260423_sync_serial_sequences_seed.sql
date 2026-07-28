-- ============================================================================
-- SYNC SERIAL SEQUENCES (run last in pipeline)
-- Seed files use explicit integer ids for many lookup rows; PostgreSQL does not
-- advance serial sequences for those inserts. This script resets every affected
-- sequence to MAX(id) so application INSERTs using DEFAULT get unique PKs.
--
-- Prefix 9999_ so this file sorts after any future ####_*_seed*.sql (0000–9998).
-- Safe to re-run: idempotent relative to current MAX(id) per table.
-- ============================================================================

SELECT setval('activities_id_seq', COALESCE((SELECT MAX(id) FROM activities), 1), true);
SELECT setval('activity_history_id_seq', COALESCE((SELECT MAX(id) FROM activity_history), 1), true);
SELECT setval('activity_representatives_id_seq', COALESCE((SELECT MAX(id) FROM activity_representatives), 1), true);
SELECT setval('activity_statuses_id_seq', COALESCE((SELECT MAX(id) FROM activity_statuses), 1), true);
SELECT setval('categories_id_seq', COALESCE((SELECT MAX(id) FROM categories), 1), true);
SELECT setval('cities_id_seq', COALESCE((SELECT MAX(id) FROM cities), 1), true);
SELECT setval('comms_materials_id_seq', COALESCE((SELECT MAX(id) FROM comms_materials), 1), true);
SELECT setval('date_statuses_id_seq', COALESCE((SELECT MAX(id) FROM date_statuses), 1), true);
SELECT setval('event_planners_id_seq', COALESCE((SELECT MAX(id) FROM event_planners), 1), true);
SELECT setval('government_representatives_id_seq', COALESCE((SELECT MAX(id) FROM government_representatives), 1), true);
SELECT setval('ministries_id_seq', COALESCE((SELECT MAX(id) FROM ministries), 1), true);
SELECT setval('ministry_groups_id_seq', COALESCE((SELECT MAX(id) FROM ministry_groups), 1), true);
SELECT setval('news_release_distributions_id_seq', COALESCE((SELECT MAX(id) FROM news_release_distributions), 1), true);
SELECT setval('news_release_origins_id_seq', COALESCE((SELECT MAX(id) FROM news_release_origins), 1), true);
SELECT setval('organizations_id_seq', COALESCE((SELECT MAX(id) FROM organizations), 1), true);
SELECT setval('permissions_id_seq', COALESCE((SELECT MAX(id) FROM permissions), 1), true);
SELECT setval('pitch_required_statuses_id_seq', COALESCE((SELECT MAX(id) FROM pitch_required_statuses), 1), true);
SELECT setval('pitch_statuses_id_seq', COALESCE((SELECT MAX(id) FROM pitch_statuses), 1), true);
SELECT setval('premier_requested_id_seq', COALESCE((SELECT MAX(id) FROM premier_requested), 1), true);
SELECT setval('reports_id_seq', COALESCE((SELECT MAX(id) FROM reports), 1), true);
SELECT setval('roles_id_seq', COALESCE((SELECT MAX(id) FROM roles), 1), true);
-- sectors: UUID PK (gen_random_uuid), no serial sequence — omit setval
SELECT setval('tags_id_seq', COALESCE((SELECT MAX(id) FROM tags), 1), true);
SELECT setval('team_history_id_seq', COALESCE((SELECT MAX(id) FROM team_history), 1), true);
SELECT setval('teams_id_seq', COALESCE((SELECT MAX(id) FROM teams), 1), true);
SELECT setval('themes_id_seq', COALESCE((SELECT MAX(id) FROM themes), 1), true);
SELECT setval('time_statuses_id_seq', COALESCE((SELECT MAX(id) FROM time_statuses), 1), true);
SELECT setval('translation_required_statuses_id_seq', COALESCE((SELECT MAX(id) FROM translation_required_statuses), 1), true);
SELECT setval('translated_languages_id_seq', COALESCE((SELECT MAX(id) FROM translated_languages), 1), true);
SELECT setval('user_history_id_seq', COALESCE((SELECT MAX(id) FROM user_history), 1), true);
SELECT setval('users_id_seq', COALESCE((SELECT MAX(id) FROM users), 1), true);
SELECT setval('venue_addresses_id_seq', COALESCE((SELECT MAX(id) FROM venue_addresses), 1), true);
SELECT setval('venue_presets_id_seq', COALESCE((SELECT MAX(id) FROM venue_presets), 1), true);
SELECT setval('venue_statuses_id_seq', COALESCE((SELECT MAX(id) FROM venue_statuses), 1), true);
