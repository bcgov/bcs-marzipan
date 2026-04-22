import { useEffect, useMemo, useRef, useState } from 'react';

import type { CustomReportFieldConfig } from '@corpcal/shared/reports/customReportFieldConfig';
import type { ReportSectionData } from '@/api/reportsApi';
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
}

/**
 * Paginated wrapper around {@link CustomReportPreviewTable} using the same
 * {@link TableScrollContainer} and {@link TablePagination} pattern as Users / Teams.
 */
export function CustomReportPreviewSection({
  section,
  config,
  onFieldsChange,
}: CustomReportPreviewSectionProps) {
  const tableScrollRef = useRef<HTMLDivElement>(null);
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

  if (!hasSelectedColumns) {
    return (
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden pb-1">
        <CustomReportPreviewTable
          activities={[]}
          config={config}
          onFieldsChange={onFieldsChange}
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden pb-1">
      <TableScrollContainer ref={tableScrollRef} className="min-h-0 flex-1">
        <CustomReportPreviewTable
          activities={paginatedActivities}
          config={config}
          onFieldsChange={onFieldsChange}
        />
      </TableScrollContainer>
      {totalItems > 0 ? (
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
      ) : null}
    </div>
  );
}
