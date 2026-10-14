import { getTableName, sql, type SQL } from 'drizzle-orm';

import {
  activities,
  activityCategories,
  activityCommsContacts,
  activityCommsMaterials,
  activityEventPlanners,
  activityHistory,
  activityReportSettings,
  activityRepresentatives,
  activitySectors,
  activitySharedWithTeams,
  activitySubscriptions,
  activityTags,
  activityThemes,
  activityTranslationsRequired,
  editLocks,
  venueAddresses,
} from '@corpcal/database/schema';

/**
 * Tables cleaned in ActivitiesService.remove() without an activities.id FK
 * (polymorphic entity_type/entity_id or other non-FK coupling).
 */
export const ACTIVITY_HARD_DELETE_POLYMORPHIC_TABLES = ['edit_locks'] as const;

/**
 * Drizzle tables deleted explicitly in ActivitiesService.remove(), in call order.
 * Other activities.id FK dependents may use ON DELETE CASCADE in the database.
 */
export const ACTIVITY_HARD_DELETE_EXPLICIT_DELETE_TABLES = [
  activityHistory,
  activityCategories,
  activityCommsContacts,
  activityCommsMaterials,
  activityEventPlanners,
  activityReportSettings,
  activityRepresentatives,
  activitySharedWithTeams,
  activitySectors,
  activityTags,
  activityThemes,
  activityTranslationsRequired,
  activitySubscriptions,
  venueAddresses,
  editLocks,
  activities,
] as const;

export function getActivityHardDeleteExplicitTableNames(): string[] {
  return ACTIVITY_HARD_DELETE_EXPLICIT_DELETE_TABLES.map((table) =>
    getTableName(table)
  );
}

export type ActivityForeignKeyDependency = {
  tableName: string;
  deleteRule: string;
};

type DbExecute = {
  execute: (query: SQL) => Promise<unknown>;
};

const ACTIVITY_FK_DEPENDENCIES_QUERY = sql`
  SELECT
    tc.table_name AS table_name,
    rc.delete_rule AS delete_rule
  FROM information_schema.table_constraints AS tc
  JOIN information_schema.referential_constraints AS rc
    ON tc.constraint_schema = rc.constraint_schema
    AND tc.constraint_name = rc.constraint_name
  JOIN information_schema.constraint_column_usage AS ccu
    ON rc.unique_constraint_schema = ccu.constraint_schema
    AND rc.unique_constraint_name = ccu.constraint_name
  WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND ccu.table_schema = 'public'
    AND ccu.table_name = 'activities'
    AND ccu.column_name = 'id'
  ORDER BY tc.table_name
`;

/** Load FK dependents of activities.id from the live database catalog. */
export async function fetchActivityForeignKeyDependencies(
  db: DbExecute
): Promise<ActivityForeignKeyDependency[]> {
  const result = await db.execute(ACTIVITY_FK_DEPENDENCIES_QUERY);
  const rows = Array.isArray(result)
    ? result
    : ((result as { rows?: unknown[] }).rows ?? []);

  if (!Array.isArray(rows)) {
    throw new Error(
      'fetchActivityForeignKeyDependencies: unexpected query result shape'
    );
  }

  return rows.map((row) => {
    const record = row as Record<string, unknown>;
    const tableName = record.table_name ?? record.tableName;
    const deleteRule = record.delete_rule ?? record.deleteRule;

    if (typeof tableName !== 'string' || typeof deleteRule !== 'string') {
      throw new Error(
        'fetchActivityForeignKeyDependencies: row missing table_name or delete_rule'
      );
    }

    return { tableName, deleteRule };
  });
}

/**
 * Returns activities.id FK dependents not handled by CASCADE or an explicit
 * delete in ActivitiesService.remove().
 */
export function findUnhandledActivityForeignKeys(
  dependencies: ActivityForeignKeyDependency[],
  options?: { explicitDeleteTableNames?: readonly string[] }
): string[] {
  const explicitDeletes = new Set(
    options?.explicitDeleteTableNames ??
      getActivityHardDeleteExplicitTableNames()
  );

  return dependencies
    .filter(
      (dependency) =>
        dependency.deleteRule !== 'CASCADE' &&
        !explicitDeletes.has(dependency.tableName)
    )
    .map((dependency) => dependency.tableName)
    .sort();
}

/** Throws when any activities.id FK is neither CASCADE nor explicitly deleted. */
export function assertActivityHardDeleteSchemaCoverage(
  dependencies: ActivityForeignKeyDependency[],
  options?: { explicitDeleteTableNames?: readonly string[] }
): void {
  const unhandled = findUnhandledActivityForeignKeys(dependencies, options);
  if (unhandled.length === 0) {
    return;
  }

  throw new Error(
    [
      'Every activities.id FK must use ON DELETE CASCADE or be deleted in ActivitiesService.remove().',
      `Unhandled tables: ${unhandled.join(', ')}.`,
      `Explicit deletes: ${(options?.explicitDeleteTableNames ?? getActivityHardDeleteExplicitTableNames()).join(', ')}.`,
      `Polymorphic: ${ACTIVITY_HARD_DELETE_POLYMORPHIC_TABLES.join(', ')}.`,
    ].join(' ')
  );
}
