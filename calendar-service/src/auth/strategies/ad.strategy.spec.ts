import { describe, expect, it, vi } from 'vitest';

import { syncAzureIdentity } from './ad.strategy';

describe('syncAzureIdentity', () => {
  it('updates only Microsoft mirror fields, not CorpCal display_name', async () => {
    const set = vi.fn().mockReturnThis();
    const where = vi.fn().mockResolvedValue(undefined);
    const update = vi.fn(() => ({ set, where }));
    const db = { update } as never;

    await syncAzureIdentity(db, 9, {
      externalId: 'azure-9',
      username: 'JSMITH',
      displayName: 'Jane Smith',
      email: 'jane@gov.bc.ca',
    });

    expect(update).toHaveBeenCalledTimes(1);
    const payload = set.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(payload).toMatchObject({
      externalId: 'azure-9',
      adUsername: 'JSMITH',
      adDisplayName: 'Jane Smith',
      adEmail: 'jane@gov.bc.ca',
    });
    expect(payload).not.toHaveProperty('displayName');
    expect(where).toHaveBeenCalledTimes(1);
  });
});
