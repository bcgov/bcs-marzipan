import { describe, expect, it } from 'vitest';

import {
  parseIsoDateLocal,
  PRESETS_FUTURE_FROM_ANCHOR,
  PRESETS_PAST_FROM_ANCHOR,
  type ScheduledDatePreset,
} from './scheduled-date-presets';

const ANCHOR = parseIsoDateLocal('2026-09-08');

function presetByLabel(
  presets: readonly ScheduledDatePreset[],
  label: string
): ScheduledDatePreset {
  const preset = presets.find((p) => p.label === label);
  if (!preset) {
    throw new Error(`Preset not found: ${label}`);
  }
  return preset;
}

describe('scheduled-date-presets', () => {
  describe('PRESETS_PAST_FROM_ANCHOR', () => {
    it('anchors Today at start-of-day', () => {
      expect(
        presetByLabel(PRESETS_PAST_FROM_ANCHOR, 'Today').toIsoDate(ANCHOR)
      ).toBe('2026-09-08');
    });

    it('uses fixed day offsets for 30 and 90 days ago', () => {
      expect(
        presetByLabel(PRESETS_PAST_FROM_ANCHOR, '30 days ago').toIsoDate(ANCHOR)
      ).toBe('2026-08-09');
      expect(
        presetByLabel(PRESETS_PAST_FROM_ANCHOR, '90 days ago').toIsoDate(ANCHOR)
      ).toBe('2026-06-10');
    });

    it('uses fixed day offsets for 7 and 14 days ago', () => {
      expect(
        presetByLabel(PRESETS_PAST_FROM_ANCHOR, '7 days ago').toIsoDate(ANCHOR)
      ).toBe('2026-09-01');
      expect(
        presetByLabel(PRESETS_PAST_FROM_ANCHOR, '14 days ago').toIsoDate(ANCHOR)
      ).toBe('2026-08-25');
    });
  });

  describe('PRESETS_FUTURE_FROM_ANCHOR', () => {
    it('anchors Today at start-of-day', () => {
      expect(
        presetByLabel(PRESETS_FUTURE_FROM_ANCHOR, 'Today').toIsoDate(ANCHOR)
      ).toBe('2026-09-08');
    });

    it('uses fixed day offsets for 30 and 90 days out', () => {
      expect(
        presetByLabel(PRESETS_FUTURE_FROM_ANCHOR, '30 days out').toIsoDate(
          ANCHOR
        )
      ).toBe('2026-10-08');
      expect(
        presetByLabel(PRESETS_FUTURE_FROM_ANCHOR, '90 days out').toIsoDate(
          ANCHOR
        )
      ).toBe('2026-12-07');
    });

    it('uses fixed day offsets for 7 and 14 days out', () => {
      expect(
        presetByLabel(PRESETS_FUTURE_FROM_ANCHOR, '7 days out').toIsoDate(
          ANCHOR
        )
      ).toBe('2026-09-15');
      expect(
        presetByLabel(PRESETS_FUTURE_FROM_ANCHOR, '14 days out').toIsoDate(
          ANCHOR
        )
      ).toBe('2026-09-22');
    });
  });
});
