import { describe, expect, it, vi } from 'vitest';

import { getRecurringLockoutInlineMessage } from './recurring-lockout-inline-message';

describe('getRecurringLockoutInlineMessage', () => {
  it('includes the formatted lockout end time and read-only guidance', () => {
    expect(getRecurringLockoutInlineMessage({ endTimeOfDay: '16:00' })).toBe(
      'Updates to activities are locked until 4:00 pm PT. You can view in read-only.'
    );
  });
});

describe('revertActivityEditSession', () => {
  it('releases the server lock when provided and resets dirty form state', async () => {
    vi.useFakeTimers();

    const release = vi.fn().mockResolvedValue(undefined);
    const applyExternalLockReleased = vi.fn();
    const setFormUiEpoch = vi.fn();
    const setIsEditing = vi.fn();
    const reset = vi.fn();
    const form = { reset } as never;
    const initialFormData = { title: 'Baseline' } as never;

    const { revertActivityEditSession } =
      await import('./revert-activity-edit-session');

    await revertActivityEditSession({
      isEditing: true,
      initialFormData,
      form,
      setFormUiEpoch,
      setIsEditing,
      applyExternalLockReleased,
      release,
    });

    expect(release).toHaveBeenCalledTimes(1);
    expect(applyExternalLockReleased).toHaveBeenCalledTimes(1);
    expect(setFormUiEpoch).toHaveBeenCalledTimes(1);
    expect(setIsEditing).toHaveBeenCalledWith(false);

    vi.runAllTicks();
    expect(reset).toHaveBeenCalledWith(initialFormData);

    vi.useRealTimers();
  });
});
