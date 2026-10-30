import { describe, expect, it } from 'vitest';

import { cloneActivityRequestSchema } from './clone-activity.schema';

function minimalCloneRequest(overrides: Record<string, unknown> = {}) {
  return {
    title: 'CLONED Test activity',
    startDate: '2026-06-01',
    endDate: '2026-06-01',
    ...overrides,
  };
}

describe('cloneActivityRequestSchema', () => {
  it('accepts minimal valid request with required schedule dates', () => {
    const result = cloneActivityRequestSchema.parse(minimalCloneRequest());
    expect(result.title).toBe('CLONED Test activity');
    expect(result.startDate).toBe('2026-06-01');
    expect(result.endDate).toBe('2026-06-01');
  });

  it('requires startDate and endDate', () => {
    const missingStart = cloneActivityRequestSchema.safeParse(
      minimalCloneRequest({ startDate: undefined })
    );
    expect(missingStart.success).toBe(false);
    if (missingStart.success) return;
    expect(
      missingStart.error.issues.some((i) => i.path[0] === 'startDate')
    ).toBe(true);

    const missingEnd = cloneActivityRequestSchema.safeParse(
      minimalCloneRequest({ endDate: undefined })
    );
    expect(missingEnd.success).toBe(false);
    if (missingEnd.success) return;
    expect(missingEnd.error.issues.some((i) => i.path[0] === 'endDate')).toBe(
      true
    );
  });

  it('rejects null schedule dates', () => {
    const nullStart = cloneActivityRequestSchema.safeParse(
      minimalCloneRequest({ startDate: null })
    );
    expect(nullStart.success).toBe(false);

    const nullEnd = cloneActivityRequestSchema.safeParse(
      minimalCloneRequest({ endDate: null })
    );
    expect(nullEnd.success).toBe(false);
  });

  it('rejects invalid date strings', () => {
    const invalid = cloneActivityRequestSchema.safeParse(
      minimalCloneRequest({ startDate: 'not-a-date' })
    );
    expect(invalid.success).toBe(false);
    if (invalid.success) return;
    expect(invalid.error.issues[0].path).toEqual(['startDate']);
  });

  it('rejects end date before start date', () => {
    const result = cloneActivityRequestSchema.safeParse(
      minimalCloneRequest({
        startDate: '2026-06-10',
        endDate: '2026-06-01',
      })
    );
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues.some((i) => i.path[0] === 'endDate')).toBe(true);
  });
});
