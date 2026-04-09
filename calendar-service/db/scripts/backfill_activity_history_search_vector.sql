-- Backfill helper script for incremental batching
-- Run this repeatedly with adjusted offsets/limits for large tables.

DO $$
DECLARE
  batch_size integer := 10000;
  last_id integer := 0;
  rows_processed integer := 0;
BEGIN
  LOOP
    WITH to_update AS (
      SELECT ah.id, a.title, a.display_id, u.ad_display_name, u.ad_username,
        cat.cat_names, tag.tag_names, ah.notes
      FROM activity_history ah
      JOIN activities a ON ah.activity_id = a.id
      LEFT JOIN users u ON ah.user_id = u.id
      LEFT JOIN (
        SELECT ac.activity_id, string_agg(c.display_name, ' ') AS cat_names
        FROM activity_categories ac
        JOIN categories c ON ac.category_id = c.id
        GROUP BY ac.activity_id
      ) AS cat ON cat.activity_id = ah.activity_id
      LEFT JOIN (
        SELECT s.activity_id, string_agg(t.display_name, ' ') AS tag_names
        FROM activity_subscriptions s
        JOIN tags t ON s.tag_id = t.id
        GROUP BY s.activity_id
      ) AS tag ON tag.activity_id = ah.activity_id
      WHERE ah.id > last_id
      ORDER BY ah.id
      LIMIT batch_size
    ), updated AS (
      UPDATE activity_history ah2
      SET
        activity_title = to_update.title,
        activity_display_id = to_update.display_id,
        actor_display_name = to_update.ad_display_name,
        actor_username = to_update.ad_username,
        category_tags_text = COALESCE(to_update.cat_names,'') || ' ' || COALESCE(to_update.tag_names,'')
      FROM to_update
      WHERE ah2.id = to_update.id
      RETURNING ah2.id
    )
    SELECT COALESCE(MAX(id), last_id), COUNT(*)
    INTO last_id, rows_processed
    FROM updated;
    IF rows_processed = 0 THEN
      EXIT;
    END IF;
  END LOOP;
END$$;
