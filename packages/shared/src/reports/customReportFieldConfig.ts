/**
 * Group headings for custom report field picker / column layout.
 * Keep values stable for persisted user preferences.
 */
export const CUSTOM_REPORT_SECTIONS = {
  GENERAL: 'General',
  SCHEDULING: 'Scheduling',
  LOCATION: 'Location',
  COMMS: 'Comms',
} as const;

/**
 * Single configurable column/field for Custom Reports.
 *
 * `key` should match a top-level `ActivityResponse` property where possible
 * (including computed fields such as `leadMinistry`, `venueAddress`). Call sites may
 * later support dotted paths for nested display if needed.
 */
export type CustomReportFieldConfig = {
  /** Maps to an ActivityResponse field (or future dotted path). */
  key: string;
  /** User-editable column / field label in UI and exports. */
  label: string;
  /** Whether this field is included in the report. */
  selected: boolean;
  /** Section grouping in the editor (e.g. General, Scheduling). */
  section: string;
  /**
   * Global display order (lower first). Used for column order and modal lists.
   * Unique across all fields in one config.
   */
  order: number;
  /** Optional column width in pixels (preview table resize). */
  width?: number;
};

/**
 * Default Custom Report field list: common {@link ActivityResponse} fields grouped by section.
 * Clone or deep-copy when mutating (e.g. in the Edit Report modal).
 */
export const DEFAULT_CUSTOM_REPORT_FIELD_CONFIG: readonly CustomReportFieldConfig[] =
  [
    // General
    {
      key: 'title',
      label: 'Title',
      selected: true,
      section: CUSTOM_REPORT_SECTIONS.GENERAL,
      order: 0,
    },
    {
      key: 'summary',
      label: 'Summary',
      selected: true,
      section: CUSTOM_REPORT_SECTIONS.GENERAL,
      order: 1,
    },
    {
      key: 'executiveSummary',
      label: 'Executive summary',
      selected: true,
      section: CUSTOM_REPORT_SECTIONS.GENERAL,
      order: 2,
    },
    {
      key: 'significance',
      label: 'Significance',
      selected: true,
      section: CUSTOM_REPORT_SECTIONS.GENERAL,
      order: 3,
    },
    {
      key: 'displayId',
      label: 'Activity ID',
      selected: true,
      section: CUSTOM_REPORT_SECTIONS.GENERAL,
      order: 4,
    },
    {
      key: 'category',
      label: 'Categories',
      selected: true,
      section: CUSTOM_REPORT_SECTIONS.GENERAL,
      order: 5,
    },
    {
      key: 'tags',
      label: 'Tags',
      selected: true,
      section: CUSTOM_REPORT_SECTIONS.GENERAL,
      order: 6,
    },
    {
      key: 'isConfidential',
      label: 'Confidential',
      selected: true,
      section: CUSTOM_REPORT_SECTIONS.GENERAL,
      order: 7,
    },
    {
      key: 'isIssue',
      label: 'Issue',
      selected: true,
      section: CUSTOM_REPORT_SECTIONS.GENERAL,
      order: 8,
    },
    // Scheduling
    {
      key: 'startDate',
      label: 'Start date',
      selected: true,
      section: CUSTOM_REPORT_SECTIONS.SCHEDULING,
      order: 9,
    },
    {
      key: 'endDate',
      label: 'End date',
      selected: true,
      section: CUSTOM_REPORT_SECTIONS.SCHEDULING,
      order: 10,
    },
    {
      key: 'startTime',
      label: 'Start time',
      selected: true,
      section: CUSTOM_REPORT_SECTIONS.SCHEDULING,
      order: 11,
    },
    {
      key: 'endTime',
      label: 'End time',
      selected: true,
      section: CUSTOM_REPORT_SECTIONS.SCHEDULING,
      order: 12,
    },
    {
      key: 'isAllDay',
      label: 'All day',
      selected: true,
      section: CUSTOM_REPORT_SECTIONS.SCHEDULING,
      order: 13,
    },
    {
      key: 'timeStatus',
      label: 'Time status',
      selected: true,
      section: CUSTOM_REPORT_SECTIONS.SCHEDULING,
      order: 14,
    },
    {
      key: 'dateStatus',
      label: 'Date status',
      selected: true,
      section: CUSTOM_REPORT_SECTIONS.SCHEDULING,
      order: 15,
    },
    {
      key: 'schedulingNotes',
      label: 'Scheduling notes',
      selected: true,
      section: CUSTOM_REPORT_SECTIONS.SCHEDULING,
      order: 16,
    },
    // Location
    {
      key: 'venueAddress',
      label: 'Location / venue',
      selected: true,
      section: CUSTOM_REPORT_SECTIONS.LOCATION,
      order: 17,
    },
    {
      key: 'venueStatus',
      label: 'Venue status',
      selected: true,
      section: CUSTOM_REPORT_SECTIONS.LOCATION,
      order: 18,
    },
    // Comms & lead (report-facing)
    {
      key: 'leadMinistry',
      label: 'Lead ministry',
      selected: true,
      section: CUSTOM_REPORT_SECTIONS.COMMS,
      order: 19,
    },
    {
      key: 'leadMinistryAbbreviation',
      label: 'Lead ministry (abbr.)',
      selected: true,
      section: CUSTOM_REPORT_SECTIONS.COMMS,
      order: 20,
    },
    {
      key: 'leadOrg',
      label: 'Lead organization',
      selected: true,
      section: CUSTOM_REPORT_SECTIONS.COMMS,
      order: 21,
    },
    {
      key: 'leadTeamDisplayName',
      label: 'Lead team',
      selected: true,
      section: CUSTOM_REPORT_SECTIONS.COMMS,
      order: 22,
    },
    {
      key: 'commsContacts',
      label: 'Comms contacts',
      selected: true,
      section: CUSTOM_REPORT_SECTIONS.COMMS,
      order: 23,
    },
    {
      key: 'newsReleaseOrigin',
      label: 'News release origin',
      selected: true,
      section: CUSTOM_REPORT_SECTIONS.COMMS,
      order: 24,
    },
    {
      key: 'commsMaterials',
      label: 'Comms materials',
      selected: true,
      section: CUSTOM_REPORT_SECTIONS.COMMS,
      order: 25,
    },
    {
      key: 'premierRequested',
      label: 'Premier requested',
      selected: true,
      section: CUSTOM_REPORT_SECTIONS.COMMS,
      order: 26,
    },
    {
      key: 'translationsRequiredStatus',
      label: 'Translations status',
      selected: true,
      section: CUSTOM_REPORT_SECTIONS.COMMS,
      order: 27,
    },
    {
      key: 'translationsRequired',
      label: 'Translations required',
      selected: true,
      section: CUSTOM_REPORT_SECTIONS.COMMS,
      order: 28,
    },
    {
      key: 'activityStatus',
      label: 'Activity status',
      selected: true,
      section: CUSTOM_REPORT_SECTIONS.COMMS,
      order: 29,
    },
    {
      key: 'lookAheadStatus',
      label: 'Look ahead status',
      selected: true,
      section: CUSTOM_REPORT_SECTIONS.COMMS,
      order: 30,
    },
  ];
