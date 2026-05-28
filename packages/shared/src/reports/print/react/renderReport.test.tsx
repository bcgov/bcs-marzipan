import { describe, expect, it } from 'vitest';

import type { ReportDataResponse } from '../../../api/report-data';
import type { ActivityResponse } from '../../../schemas/activity-response.schema';
import { buildLookAheadReportPdfHeaderTemplateHtml } from './buildLookAheadReportPdfHeaderTemplate';
import { buildReportPdfFooterTemplateHtml } from './buildReportPdfFooterTemplate';
import {
  renderPrintReportDocumentHtml,
  renderPrintReportFragmentHtml,
  wrapPrintReportHtmlDocument,
} from './renderReport';
import { buildTranslationLanguageLabelResolver } from './translationLanguageDisplayLabels';

const TEST_TRANSLATION_RESOLVER = buildTranslationLanguageLabelResolver([
  { shortcode: 'FR', displayName: 'French' },
  { shortcode: 'PUN', displayName: 'Punjabi' },
  { shortcode: 'SC', displayName: 'Chinese (Simplified)' },
  { shortcode: 'SPA', displayName: 'Spanish' },
]);

const TEST_RENDER_OPTIONS = {
  activityBaseUrl: 'http://localhost:3000',
  resolveTranslationLanguageLabel: TEST_TRANSLATION_RESOLVER,
};

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
  translationsRequired: ['FR', 'PUN'],
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
  flags: [],
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

    expect(html).toContain('data-report-template="LOOK_AHEAD"');
    expect(html).toContain('corpcal-print-pill-issue">Issue</span>');
    expect(html).not.toContain('corpcal-print-flag-narrative-inline');
    expect(html).toContain('Investment of $500M');
    expect(html).not.toContain('Minister announces housing investment');
    expect(html).not.toContain('Event planner:');
    expect(html).not.toContain('Legislative Assembly');
    expect(html).not.toContain('Last updated Apr');
    expect(html).not.toContain('Apr 27, 2026');
  });

  it('renders event lead below executive summary when a comms lead exists', () => {
    const activityWithLead = {
      ...BASE_ACTIVITY,
      commsContacts: [{ userId: 7, name: 'Jordan Smith', isLead: true }],
    };
    const fixture: ReportDataResponse = {
      ...FIXTURE,
      sections: [{ ...FIXTURE.sections[0], activities: [activityWithLead] }],
    };
    const html = renderPrintReportFragmentHtml('look-ahead', fixture, {
      activityBaseUrl: 'https://corpcal.example.gov.bc.ca',
    });
    expect(html).toContain('Event lead: Jordan Smith');
  });

  it('does not render event lead when report config omits event_lead', () => {
    const activityWithLead = {
      ...BASE_ACTIVITY,
      commsContacts: [{ userId: 7, name: 'Jordan Smith', isLead: true }],
    };
    const fixture: ReportDataResponse = {
      ...FIXTURE,
      report: {
        ...FIXTURE.report,
        config: {
          fields: ['executiveSummary', 'startDate'],
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
      sections: [{ ...FIXTURE.sections[0], activities: [activityWithLead] }],
    };
    const html = renderPrintReportFragmentHtml('look-ahead', fixture, {
      activityBaseUrl: 'https://corpcal.example.gov.bc.ca',
    });
    expect(html).not.toContain('Event lead:');
  });

  it('renders exec look-ahead print with title, inline summary, venue, and last updated in activity details', () => {
    const activityWithSignificance = {
      ...BASE_ACTIVITY,
      significance: 'High visibility announcement for cabinet briefing.',
    };
    const fixture: ReportDataResponse = {
      ...FIXTURE,
      report: {
        ...FIXTURE.report,
        name: 'exec',
        displayName: 'Executive Look Ahead Report',
      },
      sections: [
        { ...FIXTURE.sections[0], activities: [activityWithSignificance] },
      ],
    };
    const html = renderPrintReportFragmentHtml('exec', fixture, {
      activityBaseUrl: 'https://corpcal.example.gov.bc.ca',
    });

    expect(html).toContain('data-report-template="EXEC_LOOK_AHEAD"');
    expect(html).toContain('corpcal-print-pill-issue">Issue</span>');
    expect(html).not.toContain('corpcal-print-flag-narrative-inline');
    expect(html).toContain('<strong>Minister announces housing investment</strong>');
    expect(html).toContain(
      'The Minister will announce new housing funding and respond to media questions'
    );
    expect(html).toContain('High visibility announcement for cabinet briefing.');
    expect(html).toContain('Victoria, Legislative Assembly');
    expect(html).toContain('Last updated Apr');
    expect(html).not.toContain('Investment of $500M');
    expect(html).not.toContain('Apr 27, 2026');
    expect(html).not.toContain('Event planner:');
    expect(html).not.toContain('Event lead:');
  });

  it('renders thirty-sixty-ninety with exec-like body chrome and comms column', () => {
    const activityWithComms = {
      ...BASE_ACTIVITY,
      significance:
        'Major policy announcement with province-wide housing impact.',
      strategy: 'Coordinate with HOUS and GCPE before announcement.',
      commsMaterials: ['Media advisory', 'Backgrounder'],
      commsContacts: [{ userId: 7, name: 'Jordan Smith', isLead: true }],
    };
    const thirtyFixture: ReportDataResponse = {
      ...FIXTURE,
      report: {
        ...FIXTURE.report,
        name: 'thirty-sixty-ninety',
        displayName: '30/60/90',
      },
      sections: [
        {
          id: '2026-04',
          name: 'April 2026',
          order: 1,
          activities: [activityWithComms],
        },
      ],
    };
    const html = renderPrintReportFragmentHtml(
      'thirty-sixty-ninety',
      thirtyFixture,
      {
        activityBaseUrl: 'https://corpcal.example.gov.bc.ca',
        resolveTranslationLanguageLabel: TEST_TRANSLATION_RESOLVER,
      }
    );

    expect(html).toContain('data-report-template="THIRTY_SIXTY_NINETY"');
    expect(html).toContain('corpcal-print-pill-issue">Issue</span>');
    expect(html).not.toContain('corpcal-print-flag-narrative-inline');
    expect(html).not.toContain('>ISSUE</span>');
    expect(html).not.toContain('>CONFIDENTIAL</span>');
    expect(html).toContain('corpcal-print-pdf-first-page-title');
    expect(html).toContain('30/60/90 Report');
    expect(html).toContain('Comms &amp; strategy');
    expect(html).toContain('Minister announces housing investment');
    expect(html).toContain(
      'The Minister will announce new housing funding and respond to media questions'
    );
    expect(html).toContain('Major policy announcement with province-wide housing impact.');
    expect(html).toContain('Media advisory, Backgrounder');
    expect(html).toContain('Coordinate with HOUS and GCPE before announcement.');
    expect(html).toContain('French, Punjabi');
    expect(html).toContain('Jordan Smith');
    expect(html).not.toContain('Investment of $500M');
    expect(html).not.toContain('Apr 27, 2026');
    expect(html).not.toContain('Event planner:');
    expect(html).not.toContain('Issued');
  });

  it('renders the planning placeholder as a React fragment', () => {
    const html = renderPrintReportFragmentHtml('planning', FIXTURE, {
      activityBaseUrl: 'https://corpcal.example.gov.bc.ca',
    });

    expect(html).toContain('data-report-template="PLANNING"');
    expect(html).toContain('PLANNING template placeholder');
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
  });

  it('builds activity links against the provided base URL', () => {
    const html = renderPrintReportFragmentHtml('look-ahead', FIXTURE, {
      activityBaseUrl: 'https://corpcal.example.gov.bc.ca/',
    });

    expect(html).toContain('href="https://corpcal.example.gov.bc.ca/activity/101"');
    expect(html).toContain('ACT');
    expect(html).toContain('corpcal-print-activity-link');
    expect(html).toContain('>101</span>');
    expect(html).not.toContain('>ACT-101</a>');
  });

  it('includes translations list when fewer than four languages are required', () => {
    const html = renderPrintReportFragmentHtml('look-ahead', FIXTURE, TEST_RENDER_OPTIONS);

    expect(html).toContain('French, Punjabi');
    expect(html).not.toContain('Translations: 2 languages');
  });

  it('hides look-ahead translations when not Release and no news release origin', () => {
    const fixture: ReportDataResponse = {
      ...FIXTURE,
      sections: [
        {
          ...FIXTURE.sections[0],
          activities: [
            {
              ...BASE_ACTIVITY,
              category: ['Announcement'],
              newsReleaseOrigin: null,
              translationsRequired: ['FR', 'PUN'],
            },
          ],
        },
      ],
    };
    const html = renderPrintReportFragmentHtml('look-ahead', fixture, {
      activityBaseUrl: 'http://localhost:3000',
    });
    expect(html).not.toContain('French');
    expect(html).not.toContain('Punjabi');
    expect(html).not.toContain('Translations:');
  });

  it('renders TBD on look-ahead when status is pending review without languages', () => {
    const fixture: ReportDataResponse = {
      ...FIXTURE,
      sections: [
        {
          ...FIXTURE.sections[0],
          activities: [
            {
              ...BASE_ACTIVITY,
              category: ['Release'],
              newsReleaseOrigin: null,
              translationsRequiredStatus: 'Pending review',
              translationsRequired: [],
            },
          ],
        },
      ],
    };
    const html = renderPrintReportFragmentHtml('look-ahead', fixture, {
      activityBaseUrl: 'http://localhost:3000',
    });
    expect(html).toContain('TBD');
    expect(html).not.toContain('Translations:');
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
              translationsRequired: ['FR', 'PUN', 'ZH', 'ES'],
            },
          ],
        },
      ],
    };

    const html = renderPrintReportFragmentHtml('look-ahead', many, TEST_RENDER_OPTIONS);

    expect(html).toContain('4 translations');
    expect(html).not.toContain('Translations:');
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
    expect(html).toContain('#2C7DA0');
    expect(html).toContain('Events, speeches and releases (inside government)');
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

  it('omits the Release column for sections with printOmitReleaseColumn', () => {
    const awarenessAndEvents: ReportDataResponse = {
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
            {
              id: 'awareness',
              name: 'Awareness',
              order: 2,
              filter: { lookAheadSection: 'awareness' },
              printOmitReleaseColumn: true,
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
          id: 'awareness',
          name: 'Awareness',
          order: 2,
          activities: [
            {
              ...BASE_ACTIVITY,
              id: 401,
              displayId: 'ACT-401',
              lookAheadSection: 'awareness',
            },
          ],
        },
      ],
    };

    const html = renderPrintReportFragmentHtml('look-ahead', awarenessAndEvents, {
      activityBaseUrl: 'http://localhost:3000',
    });

    expect((html.match(/corpcal-print-table--omit-release/g) ?? []).length).toBe(
      1
    );
    expect((html.match(/>Release<\/th>/g) ?? []).length).toBe(1);
    expect(html).toContain('>Activity details</th>');
    expect(html).toContain('>Activity</th>');
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

  it('includes confidential activities in look-ahead with badge and executive summary', () => {
    const confidentialActivity: ActivityResponse = {
      ...BASE_ACTIVITY,
      isConfidential: true,
      executiveSummary: 'Hold for GCPE.',
      summary: 'Sensitive cabinet briefing details.',
    };
    const fixture: ReportDataResponse = {
      ...FIXTURE,
      sections: [
        { ...FIXTURE.sections[0], activities: [confidentialActivity] },
      ],
    };

    const html = renderPrintReportFragmentHtml('look-ahead', fixture, {
      activityBaseUrl: 'http://localhost:3000',
    });

    expect(html).toContain('corpcal-print-pill-confidential">Confidential</span>');
    expect(html).toContain('Hold for GCPE.');
    expect(html).not.toContain('Sensitive cabinet briefing details.');
  });

  it('includes confidential activities in exec look-ahead with badge and summary', () => {
    const confidentialActivity: ActivityResponse = {
      ...BASE_ACTIVITY,
      isConfidential: true,
      summary: 'Full summary text for executive readers.',
      executiveSummary: 'Hold for GCPE.',
    };
    const fixture: ReportDataResponse = {
      ...FIXTURE,
      report: {
        ...FIXTURE.report,
        name: 'exec',
        displayName: 'Executive Look Ahead Report',
      },
      sections: [
        { ...FIXTURE.sections[0], activities: [confidentialActivity] },
      ],
    };

    const html = renderPrintReportFragmentHtml('exec', fixture, {
      activityBaseUrl: 'http://localhost:3000',
    });

    expect(html).toContain('corpcal-print-pill-confidential">Confidential</span>');
    expect(html).toContain('Full summary text for executive readers.');
    expect(html).not.toContain('Hold for GCPE.');
  });
});

describe('buildLookAheadReportPdfHeaderTemplateHtml', () => {
  it('includes embedded logo and confidential banner copy', () => {
    const html = buildLookAheadReportPdfHeaderTemplateHtml();
    expect(html).toContain('data:image/svg+xml');
    expect(html).toContain('CONFIDENTIAL - NOT FOR CIRCULATION');
  });
});

describe('buildReportPdfFooterTemplateHtml', () => {
  it('includes last updated row, page placeholders, and Changed hint', () => {
    const html = buildReportPdfFooterTemplateHtml(FIXED_GENERATED_AT);
    expect(html).toContain('Last updated ');
    expect(html).toContain('class="pageNumber"');
    expect(html).toContain('class="totalPages"');
    expect(html).toContain('Page ');
    expect(html).not.toContain('DRAFT AND CONFIDENTIAL');
    expect(html).toContain('Changed</strong>');
    expect(html).toContain('indicates major detail or date changes only');
  });

  it('omits Changed hint when includeChangedHint is false', () => {
    const html = buildReportPdfFooterTemplateHtml(FIXED_GENERATED_AT, {
      includeChangedHint: false,
    });
    expect(html).toContain('Last updated ');
    expect(html).not.toContain('Changed</strong>');
    expect(html).not.toContain(
      'indicates major detail or date changes only (not time switches)'
    );
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
    expect(html).not.toContain('<div class="corpcal-print-pdf-footer-hint-line"');
    expect(html).not.toContain('* <strong>Changed</strong>');
    expect(html).not.toContain(
      'indicates major detail or date changes only (not time switches)'
    );
    expect(html).toContain('>101</span>');
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
    const bodyReportIdx = html.indexOf('data-report-template=');
    expect(coverIdx).toBeGreaterThan(-1);
    expect(bodyReportIdx).toBeGreaterThan(coverIdx);
  });
});

describe('wrapPrintReportHtmlDocument', () => {
  it('wrapped document omits Changed hint markup in body (hint is in Puppeteer footer template)', () => {
    const coverPageHtml =
      '<div class="corpcal-print-cover-sheet"><div class="corpcal-print-cover-inner"></div></div>';
    const html = wrapPrintReportHtmlDocument('', {
      coverPageHtml,
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
    expect(html).toContain('<body');
  });
});
