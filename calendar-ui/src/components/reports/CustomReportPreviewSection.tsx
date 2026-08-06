import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';

import type { CustomReportFieldConfig } from '@corpcal/shared/reports/customReportFieldConfig';
import type { ReportSectionData } from '@/api/reportsApi';
import { REPORT_PRINT_PREVIEW_SCROLL_HEIGHT } from '@/components/table/tableConstants';
import {
  DEFAULT_PAGE_SIZE,
  TablePagination,
} from '@/components/table/TablePagination';
import { TableScrollContainer } from '@/components/table/TableScrollContainer';

import { CustomReportPreviewTable } from './CustomReportPreviewTable';

interface CustomReportPreviewSectionProps {
  section: ReportSectionData;
  config: CustomReportFieldConfig[];
  onFieldsChange?: (fields: CustomReportFieldConfig[]) => void;
  onPaginationChange?: (change: {
    action: 'page_change' | 'page_size_change';
    page: number;
    pageSize: number;
    totalItems: number;
  }) => void;
  /** In-app preview: flash matching activity rows briefly after remote updates. */
  highlightedActivityIds?: ReadonlySet<number>;
  /** Scroll parent for pagination. */
  scrollContainerRef?: RefObject<HTMLDivElement | null>;
}

/**
 * Paginated wrapper around {@link CustomReportPreviewTable} using the same
 * {@link TableScrollContainer} and {@link TablePagination} pattern as Users / Teams.
 */
export function CustomReportPreviewSection({
  section,
  config,
  onFieldsChange,
  onPaginationChange,
  highlightedActivityIds,
  scrollContainerRef,
}: CustomReportPreviewSectionProps) {
  const internalScrollRef = useRef<HTMLDivElement>(null);
  const tableScrollRef = scrollContainerRef ?? internalScrollRef;
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  useEffect(() => {
    setPageIndex(0);
  }, [section.id]);

  const totalItems = section.activities.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePageIndex = Math.min(pageIndex, totalPages - 1);

  const paginatedActivities = useMemo(() => {
    const start = safePageIndex * pageSize;
    return section.activities.slice(start, start + pageSize);
  }, [section.activities, pageSize, safePageIndex]);

  const hasSelectedColumns = config.some((f) => f.selected);

  const table = (
    <CustomReportPreviewTable
      activities={hasSelectedColumns ? paginatedActivities : []}
      config={config}
      onFieldsChange={onFieldsChange}
      highlightedActivityIds={highlightedActivityIds}
    />
  );

  const pagination =
    totalItems > 0 ? (
      <TablePagination
        totalItems={totalItems}
        page={safePageIndex + 1}
        pageSize={pageSize}
        onPageChange={(p) => {
          setPageIndex(p - 1);
          onPaginationChange?.({
            action: 'page_change',
            page: p,
            pageSize,
            totalItems,
          });
        }}
        onPageSizeChange={(ps) => {
          setPageSize(ps);
          setPageIndex(0);
          onPaginationChange?.({
            action: 'page_size_change',
            page: 1,
            pageSize: ps,
            totalItems,
          });
        }}
        scrollContainerRef={tableScrollRef}
        aria-label="Custom report preview pagination"
      />
    ) : null;

  return (
    <div className="flex min-h-0 flex-col">
      <TableScrollContainer
        ref={tableScrollRef}
        scrollHeight={REPORT_PRINT_PREVIEW_SCROLL_HEIGHT}
        scrollAriaLabel="Report preview"
        scrollClassName="flex flex-col"
        className="report-html-container border-border"
      >
        <div className="flex w-full flex-1 flex-col">{table}</div>
      </TableScrollContainer>
      {pagination}
    </div>
  );
}
