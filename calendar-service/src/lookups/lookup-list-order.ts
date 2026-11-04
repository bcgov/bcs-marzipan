import { asc, sql } from 'drizzle-orm';
import type { AnyPgColumn, PgTable } from 'drizzle-orm/pg-core';

import type { LookupSortMode } from '@corpcal/shared/schemas';

import type { DrizzleDbExecutor } from '../database/database.provider';

export type LookupListOrderColumns = {
  sortOrder: AnyPgColumn;
  id: AnyPgColumn;
  labelColumn: AnyPgColumn;
};

/** ORDER BY clauses for published lookup list ordering. */
export function lookupListOrderBy(
  columns: LookupListOrderColumns,
  mode: LookupSortMode
) {
  const labelLower = sql`lower(${columns.labelColumn})`;
  if (mode === 'alphabetical') {
    return [asc(labelLower), asc(columns.id)] as const;
  }
  return [asc(columns.sortOrder), asc(labelLower), asc(columns.id)] as const;
}

type TableWithSortOrder = PgTable & { sortOrder: AnyPgColumn };

/** Next sort_order for append-on-create (1..n gaps allowed). */
export async function resolveNextSortOrder(
  db: DrizzleDbExecutor,
  table: TableWithSortOrder
): Promise<number> {
  const [row] = await db
    .select({
      next: sql<number>`coalesce(max(${table.sortOrder}), 0) + 1`,
    })
    .from(table);
  return row?.next ?? 1;
}
