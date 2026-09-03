-- Add the PSA activity category without modifying existing category rows.
INSERT INTO "categories" (
  "id",
  "name",
  "display_name",
  "sort_order",
  "visibility",
  "is_active",
  "description",
  "created_by",
  "last_updated_by"
)
SELECT
  14,
  'psa',
  'PSA',
  14,
  'global',
  true,
  'PSA category',
  999,
  999
WHERE NOT EXISTS (
  SELECT 1
  FROM "categories"
  WHERE "name" = 'psa'
);
--> statement-breakpoint
SELECT setval(
  pg_get_serial_sequence('categories', 'id'),
  GREATEST((SELECT COALESCE(MAX("id"), 1) FROM "categories"), 1),
  true
);
