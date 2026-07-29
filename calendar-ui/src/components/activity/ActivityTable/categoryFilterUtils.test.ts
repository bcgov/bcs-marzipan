import { describe, expect, it } from 'vitest';

import { categoryIdsToNames, categoryNamesToIds } from './categoryFilterUtils';

describe('categoryFilterUtils', () => {
  const options = [
    { value: '1', label: 'Event' },
    { value: '2', label: 'FYI' },
  ];

  it('maps names to ids and back using option ids as source of truth', () => {
    expect(categoryNamesToIds(['Event', 'FYI'], options)).toEqual([1, 2]);
    expect(categoryIdsToNames([1, 2], options)).toEqual(['Event', 'FYI']);
  });
});
