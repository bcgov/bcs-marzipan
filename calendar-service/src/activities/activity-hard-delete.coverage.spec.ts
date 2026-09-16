import {
  ACTIVITY_HARD_DELETE_EXPLICIT_DELETE_TABLES,
  assertActivityHardDeleteSchemaCoverage,
  findUnhandledActivityForeignKeys,
  getActivityHardDeleteExplicitTableNames,
} from './activity-hard-delete.coverage';

describe('activity-hard-delete.coverage', () => {
  it('lists explicit delete tables in remove() call order', () => {
    expect(getActivityHardDeleteExplicitTableNames()).toEqual([
      'activity_history',
      'activity_categories',
      'activity_comms_contacts',
      'activity_comms_materials',
      'activity_event_planners',
      'activity_report_settings',
      'activity_representatives',
      'activity_shared_with_teams',
      'activity_sectors',
      'activity_tags',
      'activity_themes',
      'activity_translation_languages',
      'activity_subscriptions',
      'venue_addresses',
      'edit_locks',
      'activities',
    ]);
    expect(ACTIVITY_HARD_DELETE_EXPLICIT_DELETE_TABLES).toHaveLength(16);
  });

  it('findUnhandledActivityForeignKeys ignores explicit non-cascade tables', () => {
    expect(
      findUnhandledActivityForeignKeys(
        [
          { tableName: 'activity_flags', deleteRule: 'CASCADE' },
          { tableName: 'activity_history', deleteRule: 'NO ACTION' },
        ],
        { explicitDeleteTableNames: ['activity_history'] }
      )
    ).toEqual([]);
  });

  it('findUnhandledActivityForeignKeys treats explicit non-cascade tables as handled', () => {
    expect(
      findUnhandledActivityForeignKeys([
        { tableName: 'activity_event_planners', deleteRule: 'NO ACTION' },
      ])
    ).toEqual([]);
  });

  it('findUnhandledActivityForeignKeys returns non-cascade tables missing from explicit deletes', () => {
    expect(
      findUnhandledActivityForeignKeys(
        [{ tableName: 'activity_new_dependent', deleteRule: 'NO ACTION' }],
        { explicitDeleteTableNames: ['activity_history'] }
      )
    ).toEqual(['activity_new_dependent']);
  });

  it('assertActivityHardDeleteSchemaCoverage passes for cascade or explicit delete', () => {
    expect(() =>
      assertActivityHardDeleteSchemaCoverage([
        { tableName: 'activity_flags', deleteRule: 'CASCADE' },
        { tableName: 'activity_history', deleteRule: 'NO ACTION' },
      ])
    ).not.toThrow();
  });

  it('assertActivityHardDeleteSchemaCoverage throws for unhandled FK rules', () => {
    expect(() =>
      assertActivityHardDeleteSchemaCoverage(
        [{ tableName: 'activity_new_dependent', deleteRule: 'NO ACTION' }],
        { explicitDeleteTableNames: ['activity_history'] }
      )
    ).toThrow(/activity_new_dependent/);
  });
});
