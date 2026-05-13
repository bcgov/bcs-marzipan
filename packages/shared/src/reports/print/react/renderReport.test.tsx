import { describe, expect, it } from 'vitest';

import type { ReportDataResponse } from '../../../api/report-data';
import type { ActivityResponse } from '../../../schemas/activity-response.schema';
import { buildLookAheadReportPdfHeaderTemplateHtml } from './buildLookAheadReportPdfHeaderTemplate';
import { buildReportPdfFooterTemplateHtml } from './buildReportPdfFooterTemplate';
import { lookAheadCoverLayoutPx } from './lookAheadCoverLayout';
import {
  renderPrintReportDocumentHtml,
  renderPrintReportFragmentHtml,
  wrapPrintReportHtmlDocument,
} from './renderReport';

const BASE_ACTIVITY: ActivityResponse = {
  id: 101,
  displayId: 'ACT-101',
  isIssue: true,
  isConfidential: false,
  title: 'Minister announces housing investment',
  summary:
    'The Minister will announce new housing funding and respond to media questions. See https://news.gov.bc.ca/backgrounders/b-101 for background.',
  significance: null,
  leadOrgId: null,
  leadOrgName: null,
  isAllDay: false,
  startDate: '2026-04-27T00:00:00.000Z',
  endDate: null,
  dateStatusId: undefined,
  startTime: '10:00',
  endTime: null,
  timeStatusId: undefined,
  venueStatusId: null,
  schedulingNotes: null,
  strategy: null,
  newsReleaseOriginId: null,
  newsReleaseId: null,
  newsReleaseDistributionId: null,
  executiveSummary:
    'Investment of $500M over three years to accelerate affordable housing near transit.',
  lookAheadStatus: 'new',
  lookAheadSection: 'events',
  notes: null,
  pitchDate: null,
  pitchRequiredStatusId: null,
  translationsRequiredStatusId: null,
  premierRequestedId: null,
  visibility: 'global',
  leadTeamId: 1,
  leadMinistryId: 1,
  activityStatusId: 1,
  createdBy: 1,
  lastUpdatedBy: 1,
  createdDateTime: '2026-04-20T00:00:00.000Z',
  lastUpdatedDateTime: '2026-04-26T17:05:00.000Z',
  category: ['Announcement'],
  tags: [],
  commsMaterials: [],
  translationsRequired: ['French', 'Punjabi'],
  representativesAttending: [],
  sharedWith: [],
  commsContacts: [],
  leadOrg: 'Ministry of Housing',
  eventPlannerDetails: [
    { name: 'Alex Planner', isLead: true },
    { name: 'Sam Backup', isLead: false },
  ],
  eventPlanners: ['Alex Planner', 'Sam Backup'],
  eventPlannerLeadIds: [],
  dateStatus: 'confirmed',
  timeStatus: 'confirmed',
  venueStatus: 'confirmed',
  activityStatus: 'active',
  newsReleaseOrigin: 'Issued',
  newsReleaseDistribution: null,
  premierRequested: null,
  pitchRequiredStatus: null,
  translationsRequiredStatus: null,
  leadMinistry: 'Housing',
  leadMinistryAbbreviation: 'HOUS',
  leadTeamDisplayName: null,
  venueAddress: {
    venueName: 'Legislative Assembly',
    addressLine1: '501 Belleville St',
    addressLine2: null,
    city: 'Victoria',
    provinceOrState: 'BC',
    country: 'Canada',
  },
  reportSettings: [],
};

const FIXTURE: ReportDataResponse = {
  report: {
    id: 1,
    name: 'look-ahead',
    displayName: 'Look Ahead',
    sortOrder: 1,
    isActive: true,
    visibility: 'global',
    config: null,
    description: null,
  },
  sections: [
    {
      id: 'events',
      name: 'Events',
      order: 1,
      activities: [BASE_ACTIVITY],
    },
  ],
};

const FIXED_GENERATED_AT = new Date('2026-04-27T15:30:00.000Z');

describe('renderPrintReportFragmentHtml', () => {
  it('renders look-ahead print with executive summary in the activity details column', () => {
    const html = renderPrintReportFragmentHtml('look-ahead', FIXTURE, {
      activityBaseUrl: 'https://corpcal.example.gov.bc.ca',
    });

    expect(html).toContain('Investment of $500M');
    expect(html).not.toContain('Minister announces housing investment');
    expect(html).toMatchSnapshot();
  });

  it('renders exec look-ahead print with title and summary in the activity details column', () => {
    const html = renderPrintReportFragmentHtml('exec', FIXTURE, {
      activityBaseUrl: 'https://corpcal.example.gov.bc.ca',
    });

    expect(html).toContain('Minister announces housing investment');
    expect(html).toContain(
      'The Minister will announce new housing funding and respond to media questions'
    );
    expect(html).not.toContain('Investment of $500M');
    expect(html).toMatchSnapshot();
  });

  it('renders the planning placeholder as a React fragment', () => {
    const html = renderPrintReportFragmentHtml('planning', FIXTURE, {
      activityBaseUrl: 'https://corpcal.example.gov.bc.ca',
    });

    expect(html).toContain('data-report-template="PLANNING"');
    expect(html).toContain('PLANNING template placeholder');
    expect(html).toMatchSnapshot();
  });

  it('renders the custom report as a React fragment', () => {
    const customFixture: ReportDataResponse = {
      ...FIXTURE,
      report: {
        ...FIXTURE.report,
        name: 'custom',
        displayName: 'Custom',
      },
      sections: [
        FIXTURE.sections[0],
        {
          id: 'empty',
          name: 'Empty',
          order: 2,
          activities: [],
        },
      ],
    };

    const html = renderPrintReportFragmentHtml('custom', customFixture, {
      activityBaseUrl: 'https://corpcal.example.gov.bc.ca',
    });

    expect(html).toContain('custom-report-root');
    expect(html).toContain('Custom');
    expect(html).toContain('Events (1)');
    expect(html).toContain('Empty (0)');
    expect(html).toMatchSnapshot();
  });

  it('builds activity links against the provided base URL', () => {
    const html = renderPrintReportFragmentHtml('look-ahead', FIXTURE, {
      activityBaseUrl: 'https://corpcal.example.gov.bc.ca/',
    });

    expect(html).toContain(
      'href="https://corpcal.example.gov.bc.ca/activity/101"'
    );
    expect(html).toContain('ACT-101');
  });

  it('includes translations list when fewer than four languages are required', () => {
    const html = renderPrintReportFragmentHtml('look-ahead', FIXTURE, {
      activityBaseUrl: 'http://localhost:3000',
    });

    expect(html).toContain('French, Punjabi');
    expect(html).not.toContain('Translations: 2 languages');
  });

  it('collapses translations to a count at four or more languages', () => {
    const many: ReportDataResponse = {
      ...FIXTURE,
      sections: [
        {
          ...FIXTURE.sections[0],
          activities: [
            {
              ...BASE_ACTIVITY,
              translationsRequired: ['French', 'Punjabi', 'Chinese', 'Spanish'],
            },
          ],
        },
      ],
    };

    const html = renderPrintReportFragmentHtml('look-ahead', many, {
      activityBaseUrl: 'http://localhost:3000',
    });

    expect(html).toContain('Translations: 4 languages');
  });

  it('renders an empty-state message when no activities exist', () => {
    const empty: ReportDataResponse = {
      ...FIXTURE,
      sections: [{ ...FIXTURE.sections[0], activities: [] }],
    };

    const html = renderPrintReportFragmentHtml('look-ahead', empty, {
      activityBaseUrl: 'http://localhost:3000',
    });

    expect(html).toContain('No activities in the selected range.');
  });

  it('renders the section heading swatch when the report config supplies a legendColor', () => {
    const withColor: ReportDataResponse = {
      ...FIXTURE,
      report: {
        ...FIXTURE.report,
        config: {
          fields: [],
          sections: [
            {
              id: 'events',
              name: 'Events',
              reportDisplayName:
                'Events, speeches and releases (inside government)',
              order: 1,
              filter: { lookAheadSection: 'events' },
              legendColor: '#2C7DA0',
              printPerDayColumnHeaderRepeat: true,
            },
          ],
        },
      },
    };

    const html = renderPrintReportFragmentHtml('look-ahead', withColor, {
      activityBaseUrl: 'http://localhost:3000',
    });

    expect(html).toContain('corpcal-print-section-swatch');
    expect(html).toContain('background-color:#2C7DA0');
    // Legend swatch styling lives on the per-day cloned column header band.
    expect(html).toContain('corpcal-print-per-day-column-header-row');
    expect(html).toContain('corpcal-print-section-thead-cell');
    expect(html).toContain('color:#ffffff');
    expect(html).toContain('Events, speeches and releases (inside government)');
  });

  it('uses dark thead foreground on light legend swatches', () => {
    const pastel: ReportDataResponse = {
      ...FIXTURE,
      report: {
        ...FIXTURE.report,
        config: {
          fields: [],
          sections: [
            {
              id: 'events',
              name: 'Events',
              reportDisplayName: 'Events section',
              order: 1,
              filter: { lookAheadSection: 'events' },
              legendColor: '#FEF9E8',
              printPerDayColumnHeaderRepeat: true,
            },
          ],
        },
      },
    };

    const html = renderPrintReportFragmentHtml('look-ahead', pastel, {
      activityBaseUrl: 'http://localhost:3000',
    });

    expect(html).toContain('corpcal-print-section-thead-cell');
    expect(html).toContain('background-color:#FEF9E8');
    expect(html).toContain('color:#000000');
  });

  it('renders per-day chrome (date row + cloned column header) only for sections that opt in', () => {
    const eventsAndIssues: ReportDataResponse = {
      ...FIXTURE,
      report: {
        ...FIXTURE.report,
        config: {
          fields: [],
          sections: [
            {
              id: 'events',
              name: 'Events',
              order: 1,
              filter: { lookAheadSection: 'events' },
              printPerDayColumnHeaderRepeat: true,
            },
            {
              id: 'issues',
              name: 'Issues',
              order: 2,
              filter: { lookAheadSection: 'issues' },
            },
          ],
        },
      },
      sections: [
        {
          id: 'events',
          name: 'Events',
          order: 1,
          activities: [BASE_ACTIVITY],
        },
        {
          id: 'issues',
          name: 'Issues',
          order: 2,
          activities: [
            {
              ...BASE_ACTIVITY,
              id: 301,
              displayId: 'ACT-301',
              lookAheadSection: 'issues',
            },
          ],
        },
      ],
    };

    const html = renderPrintReportFragmentHtml('look-ahead', eventsAndIssues, {
      activityBaseUrl: 'http://localhost:3000',
    });

    expect((html.match(/corpcal-print-day-heading-row/g) ?? []).length).toBe(1);
    expect(
      (html.match(/corpcal-print-per-day-column-header-row/g) ?? []).length
    ).toBe(1);
    expect(
      (html.match(/corpcal-print-rollup-thead-column-header-row/g) ?? []).length
    ).toBe(1);

    const issuesIdx = html.indexOf('>Issues</span>');
    const issuesActIdx = html.indexOf('ACT-301');
    expect(issuesIdx).toBeGreaterThan(-1);
    expect(issuesActIdx).toBeGreaterThan(-1);
    const issuesSlice = html.slice(issuesIdx, issuesActIdx);
    expect(issuesSlice).not.toContain('corpcal-print-day-heading-row');
    expect(issuesSlice).not.toContain(
      'corpcal-print-per-day-column-header-row'
    );
    expect(issuesSlice).toContain(
      'corpcal-print-rollup-thead-column-header-row'
    );
  });

  it('omits per-day chrome by default when printPerDayColumnHeaderRepeat is not set', () => {
    const noOverride: ReportDataResponse = {
      ...FIXTURE,
      report: {
        ...FIXTURE.report,
        config: {
          fields: [],
          sections: [
            {
              id: 'events',
              name: 'Events',
              order: 1,
              filter: { lookAheadSection: 'events' },
            },
          ],
        },
      },
    };

    const html = renderPrintReportFragmentHtml('look-ahead', noOverride, {
      activityBaseUrl: 'http://localhost:3000',
    });

    expect(html).not.toContain('corpcal-print-day-heading-row');
    expect(html).not.toContain('corpcal-print-per-day-column-header-row');
    expect(html).toContain('corpcal-print-rollup-thead-column-header-row');
  });

  it('honours an explicit printPerDayColumnHeaderRepeat: true on a non-events section', () => {
    const overridden: ReportDataResponse = {
      ...FIXTURE,
      report: {
        ...FIXTURE.report,
        config: {
          fields: [],
          sections: [
            {
              id: 'issues',
              name: 'Issues',
              order: 1,
              filter: { lookAheadSection: 'issues' },
              printPerDayColumnHeaderRepeat: true,
            },
          ],
        },
      },
      sections: [
        {
          id: 'issues',
          name: 'Issues',
          order: 1,
          activities: [
            {
              ...BASE_ACTIVITY,
              lookAheadSection: 'issues',
            },
          ],
        },
      ],
    };

    const html = renderPrintReportFragmentHtml('look-ahead', overridden, {
      activityBaseUrl: 'http://localhost:3000',
    });

    expect(html).toContain('corpcal-print-day-heading-row');
    expect(html).toContain('corpcal-print-per-day-column-header-row');
    expect(html).not.toContain('corpcal-print-rollup-thead-column-header-row');
  });

  it('lists all days for the first section before the second section (section-first layout)', () => {
    const multiSectionFixture: ReportDataResponse = {
      ...FIXTURE,
      sections: [
        {
          id: 'events',
          name: 'Events',
          order: 1,
          activities: [
            {
              ...BASE_ACTIVITY,
              id: 201,
              displayId: 'ACT-LATE',
              startDate: '2026-04-28T00:00:00.000Z',
            },
            {
              ...BASE_ACTIVITY,
              id: 202,
              displayId: 'ACT-EARLY',
              startDate: '2026-04-26T00:00:00.000Z',
            },
          ],
        },
        {
          id: 'issues',
          name: 'Issues',
          order: 2,
          activities: [
            {
              ...BASE_ACTIVITY,
              id: 203,
              displayId: 'ACT-ISSUES',
              lookAheadSection: 'issues',
              startDate: '2026-04-27T00:00:00.000Z',
            },
          ],
        },
      ],
    };

    const html = renderPrintReportFragmentHtml(
      'look-ahead',
      multiSectionFixture,
      {
        activityBaseUrl: 'https://corpcal.example.gov.bc.ca',
      }
    );

    const idxEvents = html.indexOf('>Events</span>');
    const idxIssues = html.indexOf('>Issues</span>');
    const idxEarly = html.indexOf('ACT-EARLY');
    const idxLate = html.indexOf('ACT-LATE');
    const idxIssuesAct = html.indexOf('ACT-ISSUES');

    expect(idxEvents).toBeGreaterThan(-1);
    expect(idxIssues).toBeGreaterThan(-1);
    expect(idxEvents).toBeLessThan(idxEarly);
    expect(idxEarly).toBeLessThan(idxLate);
    expect(idxLate).toBeLessThan(idxIssues);
    expect(idxIssues).toBeLessThan(idxIssuesAct);
  });
});

describe('buildLookAheadReportPdfHeaderTemplateHtml', () => {
  it('includes BC logo data URL at 28px height and scaled confidential styling', () => {
    const html = buildLookAheadReportPdfHeaderTemplateHtml();
    expect(html).toContain('data:image/svg+xml');
    expect(html).toContain('height:28px');
    expect(html).toContain('CONFIDENTIAL - NOT FOR CIRCULATION');
    expect(html).toContain('#ce3e39');
    expect(html).toContain(`font-size:${lookAheadCoverLayoutPx(8)}px`);
  });
});

describe('buildReportPdfFooterTemplateHtml', () => {
  it('includes last updated row, Chromium page placeholders, no draft/confidential', () => {
    const html = buildReportPdfFooterTemplateHtml(FIXED_GENERATED_AT);
    expect(html).toContain('Last updated ');
    expect(html).toContain('class="pageNumber"');
    expect(html).toContain('class="totalPages"');
    expect(html).toContain('Page ');
    expect(html).not.toContain('DRAFT AND CONFIDENTIAL');
    expect(html).not.toContain('CHANGED indicates major detail');
    expect(html).toContain('border-top:1px solid');
  });
});

describe('renderPrintReportDocumentHtml', () => {
  it('wraps the fragment in a standalone HTML document with injected styles', () => {
    const html = renderPrintReportDocumentHtml('look-ahead', FIXTURE, {
      activityBaseUrl: 'https://corpcal.example.gov.bc.ca',
    });

    expect(html.startsWith('<!DOCTYPE html>')).toBe(true);
    expect(html).toContain('<style>');
    expect(html).toContain('.corpcal-print-root');
    expect(html).toContain('corpcal-print-pdf-footer-hint-line');
    expect(html).toContain('* <strong>Changed</strong>');
    expect(html).toContain('indicates major detail or date changes only');
    expect(html).toContain('ACT-101');
  });

  it('embeds the provided @font-face block before the shared styles', () => {
    const fontFaceCss = "@font-face{font-family:'BC Sans';src:url(data:x)}";
    const html = renderPrintReportDocumentHtml('look-ahead', FIXTURE, {
      activityBaseUrl: 'https://corpcal.example.gov.bc.ca',
      fontFaceCss,
    });

    const fontIdx = html.indexOf(fontFaceCss);
    const rootIdx = html.indexOf('.corpcal-print-root');
    expect(fontIdx).toBeGreaterThan(-1);
    expect(rootIdx).toBeGreaterThan(fontIdx);
  });

  it('prepends optional cover HTML before the report fragment', () => {
    const coverPageHtml =
      '<div class="corpcal-print-cover-sheet"><div class="corpcal-print-cover-inner"><img src="data:image/webp;base64,UklGRiI=" alt=""/></div></div>';
    const html = renderPrintReportDocumentHtml('look-ahead', FIXTURE, {
      activityBaseUrl: 'https://corpcal.example.gov.bc.ca',
      coverPageHtml,
    });

    const coverIdx = html.indexOf('corpcal-print-cover-sheet');
    const hintIdx = html.indexOf('corpcal-print-pdf-footer-hint-line');
    const bodyReportIdx = html.indexOf('data-report-template=');
    expect(coverIdx).toBeGreaterThan(-1);
    expect(hintIdx).toBeGreaterThan(coverIdx);
    expect(bodyReportIdx).toBeGreaterThan(hintIdx);
  });
});

describe('wrapPrintReportHtmlDocument', () => {
  it('omits Changed hint markup when includePdfFooterHintLine is false', () => {
    const coverPageHtml =
      '<div class="corpcal-print-cover-sheet"><div class="corpcal-print-cover-inner"></div></div>';
    const html = wrapPrintReportHtmlDocument('', {
      coverPageHtml,
      includePdfFooterHintLine: false,
      coverStandalonePdf: true,
    });

    expect(html).toContain(coverPageHtml);
    expect(html).not.toContain('<div class="corpcal-print-pdf-footer-hint-line"');
    expect(html).not.toContain('* <strong>Changed</strong>');
  });

  it('adds cover-only body class when coverStandalonePdf is true', () => {
    const html = wrapPrintReportHtmlDocument('', {
      coverStandalonePdf: true,
    });

    expect(html).toContain('class="corpcal-print-pdf-cover-sheet-only-doc"');
  });

  it('omits body class when coverStandalonePdf is false', () => {
    const html = wrapPrintReportHtmlDocument('<div></div>', {});

    expect(html).not.toContain('class="corpcal-print-pdf-cover-sheet-only-doc"');
    expect(html).toMatch(/<body style="margin:0;background:#fff;">/);
  });
});
