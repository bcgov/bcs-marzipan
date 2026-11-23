import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useMemo, useState } from 'react';

import {
  fetchLegacyActivities,
  type LegacyActivityListItem,
} from '@/api/legacyActivitiesApi';
import { ActivityFormSection } from '@/components/activity/ActivityFormSections/ActivityFormSection';
import { PageHeader } from '@/components/layout';
import { ContentSection } from '@/components/table/ContentSection';
import { FilterSection } from '@/components/table/FilterSection';
import {
  tableBodyRow,
  tableTable,
  tableTd,
  tableTh,
  tableThead,
} from '@/components/table/tableConstants';
import { TableScrollContainer } from '@/components/table/TableScrollContainer';
import { TableContentSummary } from '@/components/table/TableSummaryBar';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

const DEFAULT_LIMIT = 100;

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

function toSourceOptions(rows: LegacyActivityListItem[]): string[] {
  const unique = new Set<string>();
  for (const row of rows) {
    if (row.sourceSystem?.trim()) unique.add(row.sourceSystem.trim());
  }
  return [...unique].sort((a, b) => a.localeCompare(b));
}

function toDisplayValue(value: string | null | undefined): string {
  if (value == null) return '-';
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : '-';
}

function toLegacySections(row: LegacyActivityListItem): LegacySection[] {
  return [
    {
      title: 'Overview',
      fields: [
        { label: 'Title', value: toDisplayValue(row.title) },
        { label: 'Summary', value: toDisplayValue(row.summary) },
        { label: 'Status', value: toDisplayValue(row.statusName) },
        { label: 'Archived', value: row.isArchived ? 'Yes' : 'No' },
      ],
    },
    {
      title: 'Look Ahead',
      fields: [
        {
          label: 'Look Ahead Status',
          value: toDisplayValue(row.lookAheadStatus),
        },
      ],
    },
    {
      title: 'Schedule',
      fields: [
        { label: 'Start Date', value: formatDate(row.startDate) },
        { label: 'End Date', value: formatDate(row.endDate) },
      ],
    },
    {
      title: 'Comms',
      fields: [
        { label: 'Lead Organization', value: toDisplayValue(row.leadOrgName) },
        { label: 'Ministry', value: toDisplayValue(row.ministryName) },
      ],
    },
    {
      title: 'Event',
      fields: [
        { label: 'Source System', value: toDisplayValue(row.sourceSystem) },
        { label: 'Source Table', value: toDisplayValue(row.sourceTable) },
        {
          label: 'Source Record ID',
          value: toDisplayValue(row.sourceRecordId),
        },
        { label: 'Imported At', value: formatDate(row.importedAt) },
      ],
    },
    {
      title: 'Location',
      fields: [
        { label: 'Location Name', value: toDisplayValue(row.locationName) },
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
  row: LegacyActivityListItem
): LegacySectionColumn {
  const sections = toLegacySections(row);
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

export function LegacyActivityDetailsView({
  row,
}: {
  row: LegacyActivityListItem;
}) {
  const { left, right } = splitSectionsForFormLayout(row);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-slate-900">
          {row.title || '(Untitled legacy record)'}
        </h2>
        <p className="text-muted-foreground text-sm">
          {row.sourceSystem} / {row.sourceTable} / {row.sourceRecordId}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
        <div className="space-y-12">
          {left.map((section) => (
            <LegacySectionCard
              key={`left-${section.title}`}
              section={section}
            />
          ))}
        </div>

        <div className="space-y-12">
          {right.map((section) => (
            <LegacySectionCard
              key={`right-${section.title}`}
              section={section}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function LegacyActivitiesPage() {
  return <LegacyActivitiesView />;
}

interface LegacyActivitiesViewProps {
  hideHeader?: boolean;
}

export function LegacyActivitiesView({
  hideHeader = false,
}: LegacyActivitiesViewProps) {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [sourceSystem, setSourceSystem] = useState('all');
  const [archivedFilter, setArchivedFilter] = useState<
    'all' | 'active' | 'archived'
  >('all');

  const archived =
    archivedFilter === 'all' ? undefined : archivedFilter === 'archived';

  const queryParams = useMemo(
    () => ({
      search: search || undefined,
      sourceSystem: sourceSystem === 'all' ? undefined : sourceSystem,
      archived,
      limit: DEFAULT_LIMIT,
      offset: 0,
    }),
    [archived, search, sourceSystem]
  );

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['legacy-activities', queryParams],
    queryFn: () => fetchLegacyActivities(queryParams),
  });

  const sourceOptions = useMemo(() => toSourceOptions(rows), [rows]);

  return (
    <>
      {!hideHeader && <PageHeader title="Legacy Data" />}

      <FilterSection>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <form
            className="relative md:col-span-2"
            onSubmit={(e) => {
              e.preventDefault();
              setSearch(searchInput.trim());
            }}
          >
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search title, summary, organization..."
              className="pl-9"
              aria-label="Search legacy activities"
            />
          </form>

          <div className="flex gap-2">
            <select
              value={sourceSystem}
              onChange={(e) => setSourceSystem(e.target.value)}
              className="border-input bg-background text-foreground focus-visible:ring-ring h-10 w-full rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:outline-none"
              aria-label="Filter by source system"
            >
              <option value="all">All sources</option>
              {sourceOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>

            <select
              value={archivedFilter}
              onChange={(e) =>
                setArchivedFilter(
                  e.target.value as 'all' | 'active' | 'archived'
                )
              }
              className="border-input bg-background text-foreground focus-visible:ring-ring h-10 w-full rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:outline-none"
              aria-label="Filter by archived state"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
      </FilterSection>

      <ContentSection>
        <TableContentSummary
          count={rows.length}
          singularLabel="legacy record"
          pluralLabel="legacy records"
        />

        <TableScrollContainer>
          <table className={tableTable}>
            <thead className={tableThead}>
              <tr>
                <th className={tableTh}>Overview</th>
                <th className={tableTh}>Summary</th>
                <th className={tableTh}>Scheduling</th>
                <th className={tableTh}>Comms</th>
                <th className={tableTh}>Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading &&
                Array.from({ length: 8 }).map((_, index) => (
                  <tr className={tableBodyRow} key={`legacy-skeleton-${index}`}>
                    <td className={tableTd} colSpan={5}>
                      <Skeleton className="h-5 w-full" />
                    </td>
                  </tr>
                ))}

              {!isLoading && rows.length === 0 && (
                <tr className={tableBodyRow}>
                  <td className={tableTd} colSpan={5}>
                    <p className="text-muted-foreground text-sm">
                      No legacy records found.
                    </p>
                  </td>
                </tr>
              )}

              {!isLoading &&
                rows.map((row) => (
                  <tr className={tableBodyRow} key={row.id}>
                    <td className={tableTd}>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {row.sourceSystem} / {row.sourceTable}#
                        {row.sourceRecordId}
                      </p>
                    </td>
                    <td className={tableTd}>
                      <Link
                        to={`/legacy-activities/${row.id}`}
                        className="font-semibold text-slate-900 no-underline hover:no-underline"
                      >
                        {row.title || '(Untitled legacy record)'}
                      </Link>
                      {row.summary && (
                        <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
                          {row.summary}
                        </p>
                      )}
                      {!row.summary && (
                        <p className="text-muted-foreground text-sm">-</p>
                      )}
                    </td>
                    <td className={tableTd}>
                      <div className="text-sm text-slate-900">
                        Start: {formatDate(row.startDate)}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        End: {formatDate(row.endDate)}
                      </div>
                    </td>
                    <td className={tableTd}>
                      <div className="text-sm text-slate-900">
                        {row.leadOrgName || '-'}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {row.ministryName || '-'}
                      </div>
                    </td>
                    <td className={tableTd}>
                      <div className="text-sm text-slate-900">
                        {row.statusName || '-'}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        Look Ahead: {row.lookAheadStatus || '-'}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </TableScrollContainer>
      </ContentSection>
    </>
  );
}
