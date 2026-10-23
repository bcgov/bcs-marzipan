import { describe, expect, it } from 'vitest';

import { cities } from '@corpcal/database/schema';

import { lookupListOrderBy } from './lookup-list-order';

describe('lookupListOrderBy', () => {
  const columns = {
    sortOrder: cities.sortOrder,
    id: cities.id,
    labelColumn: cities.displayName,
  };

  it('uses sort_order first in manual mode', () => {
    const clauses = lookupListOrderBy(columns, 'manual');
    expect(clauses).toHaveLength(3);
  });

  it('uses label first in alphabetical mode', () => {
    const clauses = lookupListOrderBy(columns, 'alphabetical');
    expect(clauses).toHaveLength(2);
  });
});
