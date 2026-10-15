import { describe, expect, it } from 'vitest';

import { notificationRecipientPatchSchema } from './notification-recipient-patch.schema';

describe('notificationRecipientPatchSchema', () => {
  it('accepts read: true', () => {
    expect(notificationRecipientPatchSchema.parse({ read: true })).toEqual({
      read: true,
    });
  });

  it('accepts dismissed: true', () => {
    expect(notificationRecipientPatchSchema.parse({ dismissed: true })).toEqual(
      { dismissed: true }
    );
  });

  it('rejects empty body', () => {
    expect(() => notificationRecipientPatchSchema.parse({})).toThrow(
      /At least one of read or dismissed must be true/
    );
  });

  it('rejects both read and dismissed', () => {
    expect(() =>
      notificationRecipientPatchSchema.parse({ read: true, dismissed: true })
    ).toThrow(/only one of read or dismissed/);
  });
});
