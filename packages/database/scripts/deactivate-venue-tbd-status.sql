BEGIN;

UPDATE venue_statuses
SET is_active = false,
    last_updated_date_time = now(),
    last_updated_by = 999
WHERE (name = 'TBD' OR display_name = 'Venue TBD')
  AND is_active = true;

COMMIT;

SELECT id, name, display_name, is_active
FROM venue_statuses
WHERE name = 'TBD' OR display_name = 'Venue TBD';