import { describe, expect, it } from 'vitest';

import type { ReportResponse } from '../../schemas/lookup.schema';
import {
  reportConfigSchema,
  type ReportConfig,
} from '../../schemas/report-config.schema';
import {
  allowedLookAheadSectionKeysFromReports,
  isAllowedLookAheadSectionKey,
  resolveLookAheadSectionRows,
} from './resolveLookAheadSectionRows';

function buildConfig(partial: Partial<ReportConfig>): ReportConfig {
  return {
    fields: [],
    sections: [],
    ...partial,
  };
}

function buildReport(
  name: string,
  config: ReportConfig | null
): ReportResponse {
  return {
    id: 1,
    name,
    displayName: name,
    sortOrder: 1,
    isActive: true,
    visibility: 'team',
    config,
    description: null,
  };
}

describe('reportConfigSchema (extensions)', () => {
  it('accepts optional uiDisplayName, reportDisplayName, legendColor, section.fields, and printOmitReleaseColumn', () => {
    const parsed = reportConfigSchema.parse({
      fields: ['startDate'],
      printTemplate: 'lookAheadV2',
      sections: [
        {
          id: 'events',
          name: 'Events',
          uiDisplayName: 'Events',
          reportDisplayName:
            'Events, speeches and releases (inside government)',
          legendColor: '#1A2B3C',
          order: 1,
          filter: { lookAheadSection: 'events' },
          fields: ['startDate', 'title'],
          printOmitReleaseColumn: true,
        },
      ],
    });
    expect(parsed.sections[0].legendColor).toBe('#1A2B3C');
    expect(parsed.sections[0].fields).toEqual(['startDate', 'title']);
    expect(parsed.sections[0].printOmitReleaseColumn).toBe(true);
    expect(parsed.printTemplate).toBe('lookAheadV2');
  });

  it('rejects invalid hex colors on legendColor', () => {
    expect(() =>
      reportConfigSchema.parse({
        fields: [],
        sections: [
          {
            id: 'events',
            name: 'Events',
            order: 1,
            legendColor: 'red',
          },
        ],
      })
    ).toThrow();
  });
});

describe('resolveLookAheadSectionRows', () => {
  it('returns rows in ascending order with merged lookAheadKey from filters', () => {
    const config = buildConfig({
      globalFilter: { dateRange: { start: '2026-01-01', end: '2026-01-31' } },
      sections: [
        {
          id: 'issues',
          name: 'Issues',
          order: 2,
          filter: { lookAheadSection: 'issues' },
        },
        {
          id: 'events',
          name: 'Events',
          order: 1,
          filter: { lookAheadSection: 'events' },
        },
      ],
    });
    const rows = resolveLookAheadSectionRows(config);
    expect(rows.map((r) => r.sectionId)).toEqual(['events', 'issues']);
    expect(rows[0]).toEqual({
      sectionId: 'events',
      order: 1,
      lookAheadKey: 'events',
      uiLabel: 'Events',
      reportLegendLabel: 'Events',
      legendColor: null,
      printPerDayColumnHeaderRepeat: null,
      printOmitReleaseColumn: null,
    });
  });

  it('falls back to name when uiDisplayName / reportDisplayName missing', () => {
    const config = buildConfig({
      sections: [
        {
          id: 'events',
          name: 'Events',
          order: 1,
          filter: { lookAheadSection: 'events' },
        },
      ],
    });
    const [row] = resolveLookAheadSectionRows(config);
    expect(row.uiLabel).toBe('Events');
    expect(row.reportLegendLabel).toBe('Events');
  });

  it('resolves printOmitReleaseColumn from section config', () => {
    const config = buildConfig({
      sections: [
        {
          id: 'awareness',
          name: 'Awareness',
          order: 1,
          filter: { lookAheadSection: 'awareness' },
          printOmitReleaseColumn: true,
        },
        {
          id: 'events',
          name: 'Events',
          order: 2,
          filter: { lookAheadSection: 'events' },
        },
      ],
    });
    const rows = resolveLookAheadSectionRows(config);
    expect(rows[0].printOmitReleaseColumn).toBe(true);
    expect(rows[1].printOmitReleaseColumn).toBeNull();
  });

  it('uses uiDisplayName / reportDisplayName when provided', () => {
    const config = buildConfig({
      sections: [
        {
          id: 'events',
          name: 'Events',
          uiDisplayName: 'Events',
          reportDisplayName:
            'Events, speeches and releases (inside government)',
          order: 1,
          filter: { lookAheadSection: 'events' },
        },
      ],
    });
    const [row] = resolveLookAheadSectionRows(config);
    expect(row.uiLabel).toBe('Events');
    expect(row.reportLegendLabel).toBe(
      'Events, speeches and releases (inside government)'
    );
  });

  it('inherits lookAheadSection from globalFilter when section filter omits it', () => {
    const config = buildConfig({
      globalFilter: { lookAheadSection: 'events' },
      sections: [
        {
          id: 'inherited',
          name: 'Inherited',
          order: 1,
        },
      ],
    });
    const [row] = resolveLookAheadSectionRows(config);
    expect(row.lookAheadKey).toBe('events');
  });

  it('returns lookAheadKey = null for sections without a bucket', () => {
    const config = buildConfig({
      sections: [
        {
          id: 'all',
          name: 'All',
          order: 1,
        },
      ],
    });
    const [row] = resolveLookAheadSectionRows(config);
    expect(row.lookAheadKey).toBeNull();
  });

  it('drops null-key sections when requireLookAheadKey is set', () => {
    const config = buildConfig({
      sections: [
        {
          id: 'all',
          name: 'All',
          order: 1,
        },
        {
          id: 'events',
          name: 'Events',
          order: 2,
          filter: { lookAheadSection: 'events' },
        },
      ],
    });
    const rows = resolveLookAheadSectionRows(config, {
      requireLookAheadKey: true,
    });
    expect(rows.map((r) => r.sectionId)).toEqual(['events']);
  });
});

describe('allowedLookAheadSectionKeysFromReports', () => {
  it('returns first-occurrence ordered union and skips reports without config', () => {
    const lookAhead = buildReport('look-ahead', {
      fields: [],
      sections: [
        {
          id: 'events',
          name: 'Events',
          order: 1,
          filter: { lookAheadSection: 'events' },
        },
        {
          id: 'issues',
          name: 'Issues',
          order: 2,
          filter: { lookAheadSection: 'issues' },
        },
      ],
    });
    const exec = buildReport('exec', {
      fields: [],
      sections: [
        {
          id: 'events',
          name: 'Events',
          order: 1,
          filter: { lookAheadSection: 'events' },
        },
        {
          id: 'news',
          name: 'News',
          order: 2,
          filter: { lookAheadSection: 'news' },
        },
      ],
    });
    const empty = buildReport('planning', null);

    const keys = allowedLookAheadSectionKeysFromReports([
      lookAhead,
      exec,
      empty,
    ]);
    expect(keys).toEqual(['events', 'issues', 'news']);
  });
});

describe('isAllowedLookAheadSectionKey', () => {
  it('returns true only when value is in the allowed list', () => {
    expect(isAllowedLookAheadSectionKey(['events', 'issues'], 'events')).toBe(
      true
    );
    expect(isAllowedLookAheadSectionKey(['events'], 'issues')).toBe(false);
    expect(isAllowedLookAheadSectionKey(['events'], null)).toBe(false);
    expect(isAllowedLookAheadSectionKey(['events'], undefined)).toBe(false);
  });
});
