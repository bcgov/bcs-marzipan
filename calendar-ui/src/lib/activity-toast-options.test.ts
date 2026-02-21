import { describe, expect, it } from 'vitest';

import { getActivityUpdatedToastOptions } from './activity-toast-options';

describe('getActivityUpdatedToastOptions', () => {
  it('returns id activity-updated-{id} and description with displayId and title', () => {
    const result = getActivityUpdatedToastOptions({
      id: '42',
      title: 'My Activity',
      displayId: 'ACT-42',
    });
    expect(result).toEqual({
      id: 'activity-updated-42',
      description: 'ACT-42: My Activity',
      duration: 5000,
    });
  });

  it('falls back to ACT-{id} when displayId is missing', () => {
    const result = getActivityUpdatedToastOptions({
      id: '7',
      title: 'No displayId',
    });
    expect(result).toEqual({
      id: 'activity-updated-7',
      description: 'ACT-7: No displayId',
      duration: 5000,
    });
  });

  it('falls back to ACT-{id} when displayId is null', () => {
    const result = getActivityUpdatedToastOptions({
      id: '99',
      title: 'Test',
      displayId: null,
    });
    expect(result.id).toBe('activity-updated-99');
    expect(result.description).toBe('ACT-99: Test');
    expect(result.duration).toBe(5000);
  });

  it('omits colon when title is empty', () => {
    const result = getActivityUpdatedToastOptions({
      id: '1',
      displayId: 'ACT-1',
    });
    expect(result.description).toBe('ACT-1');
  });
});
