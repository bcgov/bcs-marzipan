import { sql, type SQLWrapper } from 'drizzle-orm';

export function normalizedLookupName(column: SQLWrapper) {
  return sql`lower(regexp_replace(${column}, '^[[:space:]]+|[[:space:]]+$', '', 'g'))`;
}
