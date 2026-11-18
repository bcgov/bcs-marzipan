import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';

import {
  fetchLegacyActivities,
  type LegacyActivityListItem,
} from '@/api/legacyActivitiesApi';
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
                <th className={tableTh}>Title</th>
                <th className={tableTh}>Source</th>
                <th className={tableTh}>Status</th>
                <th className={tableTh}>Start Date</th>
                <th className={tableTh}>Imported</th>
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
                      <div className="font-medium text-slate-900">
                        {row.title || '(Untitled legacy record)'}
                      </div>
                      {row.summary && (
                        <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
                          {row.summary}
                        </p>
                      )}
                    </td>
                    <td className={tableTd}>
                      <div className="text-sm text-slate-900">
                        {row.sourceSystem}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {row.sourceTable}#{row.sourceRecordId}
                      </div>
                    </td>
                    <td className={tableTd}>{row.statusName || '-'}</td>
                    <td className={tableTd}>{formatDate(row.startDate)}</td>
                    <td className={tableTd}>{formatDate(row.importedAt)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </TableScrollContainer>
      </ContentSection>
    </>
  );
}
