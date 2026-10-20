import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import {
  CONFIRMED_LOOKUP_NAME,
  PITCHED_LOOKUP_NAME,
  TBD_LOOKUP_NAME,
} from '../constants/constants';
import { applyActivitySchedulingValidation } from './activity-scheduling-validation';

function parseWithScheduling(
  data: Record<string, unknown>,
  mode: 'create' | 'update' | 'clone',
  resolvers?: Parameters<typeof applyActivitySchedulingValidation>[3]
) {
  const schema = z
    .object({})
    .passthrough()
    .superRefine((val, ctx) => {
      applyActivitySchedulingValidation(val, ctx, mode, resolvers);
    });
  return schema.safeParse(data);
}

describe('applyActivitySchedulingValidation', () => {
  const resolvers = {
    dateStatusNameForId: (id: number) =>
      id === 2 ? CONFIRMED_LOOKUP_NAME : TBD_LOOKUP_NAME,
    timeStatusNameForId: (id: number) =>
      id === 2 ? CONFIRMED_LOOKUP_NAME : TBD_LOOKUP_NAME,
    pitchRequiredStatusNameForId: (id: number) =>
      id === 4 ? PITCHED_LOOKUP_NAME : TBD_LOOKUP_NAME,
  };

  it('requires start and end dates on create', () => {
    const result = parseWithScheduling(
      { title: 'x', startDate: '2026-01-01' },
      'create'
    );
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues.some((i) => i.path[0] === 'endDate')).toBe(true);
  });

  it('accepts Confirmed date status when both dates are set', () => {
    const result = parseWithScheduling(
      {
        startDate: '2026-01-01',
        endDate: '2026-01-01',
        dateStatusId: 2,
      },
      'create',
      {
        dateStatusNameForId: () => CONFIRMED_LOOKUP_NAME,
      }
    );
    expect(result.success).toBe(true);
  });

  it('rejects Confirmed date status when end date missing', () => {
    const result = parseWithScheduling(
      {
        startDate: '2026-01-01',
        dateStatusId: 2,
      },
      'create',
      resolvers
    );
    expect(result.success).toBe(false);
  });

  it('rejects Confirmed time without times or all day', () => {
    const result = parseWithScheduling(
      {
        startDate: '2026-01-01',
        endDate: '2026-01-01',
        timeStatusId: 2,
        isAllDay: false,
      },
      'create',
      resolvers
    );
    expect(result.success).toBe(false);
  });

  it('allows Confirmed time when all day', () => {
    const result = parseWithScheduling(
      {
        startDate: '2026-01-01',
        endDate: '2026-01-01',
        timeStatusId: 2,
        isAllDay: true,
      },
      'create',
      resolvers
    );
    expect(result.success).toBe(true);
  });

  it('requires pitch date when pitch status is Pitched', () => {
    const result = parseWithScheduling(
      {
        startDate: '2026-01-01',
        endDate: '2026-01-01',
        pitchRequiredStatusId: 4,
      },
      'create',
      resolvers
    );
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues.some((i) => i.path[0] === 'pitchDate')).toBe(
      true
    );
  });
});
