export const ACTIVITY_INFO_ICON_SETTINGS_KEY =
  'activity_info_icon_settings' as const;

export const ACTIVITY_INFO_ICON_TEXT_MAX_LENGTH = 500 as const;

export const ACTIVITY_INFO_ICON_FIELD_KEYS = [
  'categoryIds',
  'title',
  'summary',
  'visibility',
  'sharedWithTeamIds',
  'isConfidential',
  'isIssue',
  'leadTeamId',
  'leadOrgId',
  'significance',
  'pitchRequiredStatusId',
  'pitchDate',
  'notes',
  'tagIds',

  'commsContacts',
  'strategy',
  'commsMaterialIds',

  'startDate',
  'endDate',
  'dateStatusId',
  'startTime',
  'endTime',
  'isAllDay',
  'timeStatusId',
  'schedulingNotes',

  'newsReleaseOriginId',
  'newsReleaseDistributionId',
  'translationsRequiredStatusId',
  'translationLanguageIds',

  'premierRequestedId',
  'representatives',
  'venueName',
  'venueStatusId',
  'addressLine1',
  'addressLine2',
  'city',
  'provinceOrState',
  'country',
  'eventPlanners',

  'executiveSummary',
  'lookAheadStatus',
  'lookAheadSection',
  'reportSettings',
] as const;

export type ActivityInfoIconFieldKey =
  (typeof ACTIVITY_INFO_ICON_FIELD_KEYS)[number];

export type ActivityInfoIconSetting = {
  fieldKey: ActivityInfoIconFieldKey;
  text: string;
};

export type ActivityInfoIconSettings = {
  items: ActivityInfoIconSetting[];
};

export const DEFAULT_ACTIVITY_INFO_ICON_SETTINGS: ActivityInfoIconSettings = {
  items: [
    {
      fieldKey: 'categoryIds',
      text: '**Event**: Event category\n\n**Release**: Release category\n\n**Awareness date**: Awareness category\n\n**Conference / AGM / Forum**: Conference / AGM / Forum category\n\n**FYI**: FYI category (use for internal awareness)\n\n**Social media**: Social media category\n\n**Speech**: Speech category\n\n**TV/Radio**: TV/Radio category',
    },
    {
      fieldKey: 'visibility',
      text: 'On: only the lead team and Share with teams can view this activity, plus the roles below. Off: visible to everyone. GCPE executive, Strategic Communications, Cabinet Priorities, and Calendar admin roles can always view all activities.',
    },
    {
      fieldKey: 'isConfidential',
      text: 'Select if the activity is highly confidential or sensitive. By default, viewing is restricted to your team. For Corporate Look Ahead, enter placeholder executive-summary copy.',
    },
    {
      fieldKey: 'isIssue',
      text: 'Select if this activity is a current or potential media issue, or an issue for government in any way based on topic.',
    },
    {
      fieldKey: 'significance',
      text: 'Describe how this will impact people and why it is important.',
    },
    {
      fieldKey: 'strategy',
      text: 'Describe any promotion, digital content, or visuals planned as part of the announcement vision.',
    },
    {
      fieldKey: 'schedulingNotes',
      text: 'Use this for the date or timeframe requested, approvals received or outstanding, criteria holding up the activity, and any date or time confirmed by a third party.',
    },
  ],
};

export const ACTIVITY_INFO_ICON_FIELD_KEY_SET: ReadonlySet<string> = new Set(
  ACTIVITY_INFO_ICON_FIELD_KEYS
);

export function buildActivityInfoIconSettingsMap(
  settings: ActivityInfoIconSettings
): Map<ActivityInfoIconFieldKey, string> {
  return new Map(settings.items.map((item) => [item.fieldKey, item.text]));
}
