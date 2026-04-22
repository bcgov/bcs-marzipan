import { describe, expect, it } from 'vitest';
import { isValidElement } from 'react';

import { generateReportHTML } from './generateReportHTML';

describe('generateReportHTML', () => {
  it('selects LOOK_AHEAD template and renders legacy print HTML for valid report data', () => {
    const payload = {
      report: { displayName: 'Look Ahead' },
      sections: [
        {
          id: 'events',
          name: 'Events, Speeches & Releases',
          order: 1,
          activities: [
            {
              id: 1,
              startDate: '2026-04-07',
              startTime: '08:30',
              title: 'Sample activity',
              summary: 'Summary line',
              executiveSummary: null,
              displayId: 'ECC-125653',
              timeStatus: 'Confirmed',
              activityStatus: 'active',
              dateStatus: '',
              leadMinistry: 'Education',
              leadMinistryAbbreviation: 'ECC',
              leadOrg: null,
              leadOrgId: null,
              leadOrgName: null,
              leadMinistryId: 1,
              leadTeamDisplayName: null,
              premierRequested: null,
              newsReleaseOrigin: 'BCGov',
              newsReleaseDistribution: null,
              isConfidential: false,
              isIssue: false,
              category: [],
              tags: [],
              lookAheadStatus: 'none',
              lookAheadSection: 'events',
              commsContacts: [],
              commsMaterials: null,
              translationsRequiredStatus: null,
              translationsRequired: null,
              representativesAttending: [],
              venueAddress: null,
              significance: null,
              eventPlannerDetails: null,
              pitchRequiredStatus: null,
              reportSettings: [],
            },
          ],
        },
      ],
    };
    const out = generateReportHTML('LOOK_AHEAD', payload);
    expect(typeof out).toBe('string');
    expect(out).toContain('data-report-template="LOOK_AHEAD"');
    expect(out).toContain('la-legacy');
    expect(out).toContain('DRAFT AND CONFIDENTIAL');
    expect(out).toContain('Events, Speeches &amp; Releases');
    expect(out).toContain('Sample activity');
    expect(out).toContain('ECC-125653');
  });

  it('selects a template and passes data through (React output)', () => {
    const payload = { executive: true };
    const out = generateReportHTML('EXEC_LOOK_AHEAD', payload);
    expect(isValidElement(out)).toBe(true);
    if (isValidElement(out)) {
      const { children } = out.props as { children?: unknown };
      expect(typeof children).toBe('string');
      if (typeof children === 'string') {
        expect(children).toContain('EXEC_LOOK_AHEAD');
        expect(children).toContain(JSON.stringify(payload));
      }
    }
  });

  it('throws for unknown reportType', () => {
    expect(() => generateReportHTML('NOT_A_REAL_TYPE', {})).toThrow(
      'Unknown report template key'
    );
  });

  it('PLANNING template still returns placeholder HTML string', () => {
    const out = generateReportHTML('PLANNING', { temp: 'usage' });
    expect(typeof out).toBe('string');
    if (typeof out !== 'string') return;
    expect(out).toContain('PLANNING');
    expect(out).toContain('data-report-template="PLANNING"');
  });
});
