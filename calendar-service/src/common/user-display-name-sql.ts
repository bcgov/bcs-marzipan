import { sql, type AnyColumn } from 'drizzle-orm';

import { users } from '@corpcal/database/schema';

/** Non-blank text or SQL null (matches resolveUserDisplayName trim behaviour). */
function trimmedUserLabelColumn(column: AnyColumn) {
  return sql<string | null>`NULLIF(TRIM(${column}), '')`;
}

/** SQL expression for the effective CorpCal user label (matches resolveUserDisplayName). */
export const userEffectiveDisplayNameSql = sql<string>`COALESCE(
  ${trimmedUserLabelColumn(users.displayName)},
  ${trimmedUserLabelColumn(users.adDisplayName)},
  ${trimmedUserLabelColumn(users.adUsername)},
  ${trimmedUserLabelColumn(users.adEmail)},
  'User ' || ${users.id}::text
)`;
