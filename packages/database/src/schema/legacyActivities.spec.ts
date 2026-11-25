import { getTableName } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { legacyActivities } from './legacyActivities';

describe('legacyActivities schema', () => {
  it('exports a dedicated legacy flat table with raw payload and searchable fields', () => {
    expect(legacyActivities).toBeDefined();
    expect(getTableName(legacyActivities)).toBe('legacy_activities');
    expect(legacyActivities.sourceRecordId).toBeDefined();
    expect(legacyActivities.searchableText).toBeDefined();
    expect(legacyActivities.rawRecord).toBeDefined();
  });
});
