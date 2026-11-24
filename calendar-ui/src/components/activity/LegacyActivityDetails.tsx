import type { LegacyActivity } from '@/api/legacyActivitiesApi';

import { ActivityFormSection } from './ActivityFormSections/ActivityFormSection';

type LegacySectionField = {
  label: string;
  value: string;
};

type LegacySection = {
  title:
    | 'Overview'
    | 'Look Ahead'
    | 'Schedule'
    | 'Comms'
    | 'Event'
    | 'Location'
    | 'Sharing';
  fields: LegacySectionField[];
};

function formatDate(value: string | null): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function toDisplayValue(value: string | null | undefined): string {
  if (value == null) return '-';
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : '-';
}

function toLegacySections(activity: LegacyActivity): LegacySection[] {
  return [
    {
      title: 'Overview',
      fields: [
        { label: 'Title', value: toDisplayValue(activity.title) },
        { label: 'Summary', value: toDisplayValue(activity.summary) },
        { label: 'Status', value: toDisplayValue(activity.statusName) },
        { label: 'Archived', value: activity.isArchived ? 'Yes' : 'No' },
      ],
    },
    {
      title: 'Look Ahead',
      fields: [
        {
          label: 'Look Ahead Status',
          value: toDisplayValue(activity.lookAheadStatus),
        },
      ],
    },
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
          label: 'Lead Organization',
          value: toDisplayValue(activity.leadOrgName),
        },
        { label: 'Ministry', value: toDisplayValue(activity.ministryName) },
      ],
    },
    {
      title: 'Event',
      fields: [
        {
          label: 'Source System',
          value: toDisplayValue(activity.sourceSystem),
        },
        { label: 'Source Table', value: toDisplayValue(activity.sourceTable) },
        {
          label: 'Source Record ID',
          value: toDisplayValue(activity.sourceRecordId),
        },
        { label: 'Imported At', value: formatDate(activity.importedAt) },
      ],
    },
    {
      title: 'Location',
      fields: [
        {
          label: 'Location Name',
          value: toDisplayValue(activity.locationName),
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
  activity: LegacyActivity
): LegacySectionColumn {
  const sections = toLegacySections(activity);
  const byTitle = new Map(sections.map((section) => [section.title, section]));

  return {
    left: [byTitle.get('Overview'), byTitle.get('Location')].filter(
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
            <dd className="mt-1 text-sm text-slate-900">{field.value}</dd>
          </div>
        ))}
      </dl>
    </ActivityFormSection>
  );
}

/** Read-only, form-style view of a legacy record grouped into the activity form sections. */
export function LegacyActivityDetails({
  activity,
}: {
  activity: LegacyActivity;
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
