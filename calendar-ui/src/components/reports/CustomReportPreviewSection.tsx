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
  /** In-app preview: flash matching activity rows briefly after remote updates. */
  highlightedActivityIds?: ReadonlySet<number>;
  /**
   * `reportPreview` matches the Reports page print-preview shell (fixed height,
   * bordered scroll container). `default` keeps the legacy flex growth layout.
   */
  layout?: 'default' | 'reportPreview';
  /** Scroll parent for pagination when `layout` is `reportPreview`. */
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
  highlightedActivityIds,
  layout = 'default',
  scrollContainerRef,
}: CustomReportPreviewSectionProps) {
  const internalScrollRef = useRef<HTMLDivElement>(null);
  const tableScrollRef = scrollContainerRef ?? internalScrollRef;
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const useReportPreviewLayout = layout === 'reportPreview';

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
        onPageChange={(p) => setPageIndex(p - 1)}
        onPageSizeChange={(ps) => {
          setPageSize(ps);
          setPageIndex(0);
        }}
        scrollContainerRef={tableScrollRef}
        aria-label="Custom report preview pagination"
      />
    ) : null;

  if (useReportPreviewLayout) {
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

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden pb-1">
      <TableScrollContainer ref={tableScrollRef} className="min-h-0 flex-1">
        {table}
      </TableScrollContainer>
      {pagination}
    </div>
  );
}
