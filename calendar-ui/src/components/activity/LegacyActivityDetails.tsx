import type { LegacyActivityDetails as LegacyActivityDetailsData } from '@/api/legacyActivitiesApi';
import { FormSectionDivider } from '@/components/ui/form-section-divider';
import {
  CORP_PACIFIC_TIME_ZONE,
  formatExactDate,
  parseDateOnlyString,
} from '@/lib/datetime-utils';

import { ActivityFormHeading } from './ActivityFormSections/ActivityFormHeading';
import { ActivityFormSection } from './ActivityFormSections/ActivityFormSection';

type LegacySectionField = {
  label: string;
  value: string;
};

type LegacySection = {
  title: 'Overview' | 'Look Ahead' | 'Schedule' | 'Comms' | 'Event' | 'Sharing';
  fields: LegacySectionField[];
  locationFields?: LegacySectionField[];
};

function formatDate(value: string | null): string {
  if (!value) return '-';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = parseDateOnlyString(value);
  return Number.isNaN(date.getTime())
    ? value
    : formatExactDate(date, { includeYear: true });
}

function formatCreatedAt(value: string | null): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return formatExactDate(date, {
    includeYear: true,
    includeTime: true,
    appendPacificTimeAbbrev: true,
    timeZone: CORP_PACIFIC_TIME_ZONE,
  });
}

function toDisplayValue(value: string | null | undefined): string {
  if (value == null) return '-';
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : '-';
}

function toBooleanDisplayValue(value: boolean | null): string {
  return value == null ? '-' : value ? 'Yes' : 'No';
}

function toLegacySections(
  activity: LegacyActivityDetailsData
): LegacySection[] {
  return [
    {
      title: 'Overview',
      fields: [
        {
          label: 'Category',
          value: toDisplayValue(activity.overview.category.join(', ')),
        },
        { label: 'Title', value: toDisplayValue(activity.title) },
        {
          label: 'Confidential',
          value: toBooleanDisplayValue(activity.overview.confidential),
        },
        {
          label: 'Issue',
          value: toBooleanDisplayValue(activity.overview.issue),
        },
        { label: 'Summary', value: toDisplayValue(activity.summary) },
        {
          label: 'Lead Organization',
          value: toDisplayValue(activity.leadOrgName),
        },
        { label: 'Ministry', value: toDisplayValue(activity.ministryName) },
        {
          label: 'Tags',
          value: toDisplayValue(activity.overview.tags.join(', ')),
        },
        {
          label: 'Significance',
          value: toDisplayValue(activity.overview.significance),
        },
        ...('notes' in activity.overview
          ? [{ label: 'Notes', value: toDisplayValue(activity.overview.notes) }]
          : []),
      ],
    },
    ...(activity.lookAhead
      ? [
          {
            title: 'Look Ahead' as const,
            fields: [
              {
                label: 'Executive Summary',
                value: toDisplayValue(activity.lookAhead.executiveSummary),
              },
              {
                label: 'Look Ahead Status',
                value: toDisplayValue(activity.lookAheadStatus),
              },
            ],
          },
        ]
      : []),
    {
      title: 'Schedule',
      fields: [
        { label: 'Start Date', value: formatDate(activity.startDate) },
        { label: 'End Date', value: formatDate(activity.endDate) },
      ],
    },
    {
      title: 'Comms',
      fields: [
        {
          label: 'Comms Materials',
          value: toDisplayValue(activity.comms.materials.join(', ')),
        },
        {
          label: 'News Release Origin',
          value: toDisplayValue(activity.comms.newsReleaseOrigin),
        },
        {
          label: 'News Release Distribution',
          value: toDisplayValue(activity.comms.newsReleaseDistribution),
        },
        {
          label: 'Translations',
          value: toDisplayValue(activity.comms.translations.join(', ')),
        },
      ],
    },
    {
      title: 'Event',
      fields: [
        {
          label: 'Premier Status',
          value: toDisplayValue(activity.event.premierStatus),
        },
        {
          label: 'Government Representatives',
          value: toDisplayValue(
            activity.event.governmentRepresentatives.join(', ')
          ),
        },
        {
          label: 'Event Planners',
          value: toDisplayValue(activity.event.eventPlanners.join(', ')),
        },
        {
          label: 'Created At',
          value: formatCreatedAt(activity.createdDateTime),
        },
      ],
      locationFields: [
        {
          label: 'Venue and City',
          value: toDisplayValue(activity.event.venueCity),
        },
      ],
    },
    {
      title: 'Sharing',
      fields: [
        {
          label: 'Shared With',
          value: 'No legacy sharing metadata available.',
        },
      ],
    },
  ];
}

type LegacySectionColumn = {
  left: LegacySection[];
  right: LegacySection[];
};

function splitSectionsForFormLayout(
  activity: LegacyActivityDetailsData
): LegacySectionColumn {
  const sections = toLegacySections(activity);
  const byTitle = new Map(sections.map((section) => [section.title, section]));

  return {
    left: [byTitle.get('Overview')].filter(
      (section): section is LegacySection => section != null
    ),
    right: [
      byTitle.get('Look Ahead'),
      byTitle.get('Schedule'),
      byTitle.get('Comms'),
      byTitle.get('Event'),
      byTitle.get('Sharing'),
    ].filter((section): section is LegacySection => section != null),
  };
}

function LegacySectionCard({ section }: { section: LegacySection }) {
  return (
    <ActivityFormSection title={section.title}>
      <dl className="space-y-4">
        {section.fields.map((field) => (
          <div key={`${section.title}-${field.label}`}>
            <dt className="text-muted-foreground text-xs tracking-wide uppercase">
              {field.label}
            </dt>
            <dd className="mt-1 text-sm break-words whitespace-pre-wrap text-slate-900">
              {field.value}
            </dd>
          </div>
        ))}
      </dl>
      {section.locationFields && (
        <>
          <FormSectionDivider />
          <ActivityFormHeading>Location</ActivityFormHeading>
          <dl className="space-y-4">
            {section.locationFields.map((field) => (
              <div key={field.label}>
                <dt className="text-muted-foreground text-xs tracking-wide uppercase">
                  {field.label}
                </dt>
                <dd className="mt-1 text-sm break-words whitespace-pre-wrap text-slate-900">
                  {field.value}
                </dd>
              </div>
            ))}
          </dl>
        </>
      )}
    </ActivityFormSection>
  );
}

/** Read-only, form-style view of a legacy record grouped into the activity form sections. */
export function LegacyActivityDetails({
  activity,
}: {
  activity: LegacyActivityDetailsData;
}) {
  const { left, right } = splitSectionsForFormLayout(activity);

  return (
    <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
      <div className="space-y-12">
        {left.map((section) => (
          <LegacySectionCard key={`left-${section.title}`} section={section} />
        ))}
      </div>

      <div className="space-y-12">
        {right.map((section) => (
          <LegacySectionCard key={`right-${section.title}`} section={section} />
        ))}
      </div>
    </div>
  );
}
