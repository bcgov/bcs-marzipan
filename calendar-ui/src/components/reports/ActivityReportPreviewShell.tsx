import { CustomReportPreviewSection } from '@/components/reports/CustomReportPreviewSection';
import { EditReportModal } from '@/components/reports/EditReportModal';
import { PrintReportPreview } from '@/components/reports/PrintReportPreview';
import { ReportLargeRangeWarning } from '@/components/reports/ReportLargeRangeWarning';
import { TableScrollContainer } from '@/components/table/TableScrollContainer';
import type { useActivityReportPreview } from '@/hooks/useActivityReportPreview';

export type ActivityReportPreviewController = ReturnType<
  typeof useActivityReportPreview
>;

function ReportPreviewEmptyState({
  ref,
  message,
  className,
}: {
  ref: React.Ref<HTMLDivElement | null>;
  message: string;
  className?: string;
}) {
  return (
    <TableScrollContainer
      ref={ref}
      scrollAriaLabel="Report preview"
      scrollClassName="flex min-h-0 flex-1 flex-col"
      className={className}
    >
      <div className="flex w-full flex-1 flex-col items-center justify-center px-6 py-12">
        <p className="text-muted-foreground">{message}</p>
      </div>
    </TableScrollContainer>
  );
}

export interface ActivityReportPreviewShellProps {
  reportName: string;
  preview: ActivityReportPreviewController;
}

export function ActivityReportPreviewShell({
  reportName,
  preview,
}: ActivityReportPreviewShellProps) {
  if (preview.error) {
    return (
      <div className="text-destructive flex flex-1 items-center justify-center px-6 py-12 text-sm">
        {preview.error instanceof Error
          ? preview.error.message
          : 'Failed to load report data'}
      </div>
    );
  }

  const showRangeWarningsBar =
    preview.showLargeRangeWarning || preview.wasDateRangeClamped;

  return (
    <>
      {showRangeWarningsBar ? (
        <div className="border-border flex h-9 shrink-0 items-center justify-end gap-4 border-b px-4">
          <ReportLargeRangeWarning
            showLargeRangeWarning={preview.showLargeRangeWarning}
            wasClamped={preview.wasDateRangeClamped}
          />
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col">
        {preview.isPreviewLoading ? (
          <ReportPreviewEmptyState
            ref={preview.reportPreviewScrollRef}
            message="Loading report..."
            className={preview.reportPreviewScrollClassName}
          />
        ) : reportName === 'custom' ? (
          preview.displayData?.sections[0] ? (
            <CustomReportPreviewSection
              section={preview.displayData.sections[0]}
              config={preview.customReportFields}
              onFieldsChange={preview.setCustomReportFields}
              onPaginationChange={preview.handleCustomReportPaginationChange}
              highlightedActivityIds={preview.reportHighlightSet}
              scrollContainerRef={preview.reportPreviewScrollRef}
            />
          ) : (
            <ReportPreviewEmptyState
              ref={preview.reportPreviewScrollRef}
              message="No activities to display"
              className={preview.reportPreviewScrollClassName}
            />
          )
        ) : preview.displayData ? (
          <TableScrollContainer
            ref={preview.reportPreviewScrollRef}
            scrollAriaLabel="Report preview"
            scrollClassName="flex min-h-0 flex-1 flex-col"
            className={preview.reportPreviewScrollClassName}
          >
            <div
              className="flex w-full flex-1 flex-col px-6 pt-0 pb-6"
              onClickCapture={preview.handleReportPreviewClickCapture}
            >
              <div
                className="report-print-preview-root min-w-0"
                style={preview.printPreviewRootStyle}
              >
                <PrintReportPreview
                  reportTypeName={reportName}
                  data={preview.displayData}
                  highlightActivityIds={preview.reportHighlightSet}
                />
              </div>
            </div>
          </TableScrollContainer>
        ) : null}
      </div>

      <EditReportModal
        open={preview.isEditModalOpen}
        onOpenChange={preview.setIsEditModalOpen}
        fields={preview.customReportFields}
        onFieldsChange={preview.setCustomReportFields}
        onSave={preview.handleSaveCustomReportConfig}
      />
    </>
  );
}
