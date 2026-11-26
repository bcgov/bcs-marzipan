import { getTableName } from 'drizzle-orm';
import { getTableConfig } from 'drizzle-orm/pg-core';
import { describe, expect, it } from 'vitest';

import { legacyActivities } from './legacyActivities';

describe('legacyActivities schema', () => {
  it('exports a dedicated legacy flat table with raw payload and searchable fields', () => {
    expect(legacyActivities).toBeDefined();
    expect(getTableName(legacyActivities)).toBe('legacy_activities');
    expect(legacyActivities.displayId).toBeDefined();
    expect(legacyActivities.activityStatusId).toBeDefined();
    expect(legacyActivities.createdDateTime).toBeDefined();
    expect(legacyActivities.searchableText).toBeDefined();
    expect(legacyActivities.rawRecord).toBeDefined();
  });

  it('uses a required status lookup and removes source and archive columns', () => {
    const config = getTableConfig(legacyActivities);
    const columns = config.columns.map((column) => column.name);
    const statusForeignKey = config.foreignKeys.find((foreignKey) =>
      foreignKey
        .reference()
        .columns.some((column) => column.name === 'activity_status_id')
    );

    expect(legacyActivities.activityStatusId.notNull).toBe(true);
    expect(statusForeignKey?.reference().foreignTable).toBeDefined();
    expect(getTableName(statusForeignKey!.reference().foreignTable)).toBe(
      'activity_statuses'
    );
    expect(columns).not.toContain('source_system');
    expect(columns).not.toContain('source_table');
    expect(columns).not.toContain('matched_activity_id');
    expect(columns).not.toContain('status_name');
    expect(columns).not.toContain('is_archived');
  });
});
