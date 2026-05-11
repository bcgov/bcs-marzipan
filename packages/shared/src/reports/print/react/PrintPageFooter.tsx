import {
  formatPrintReportGeneratedAt,
  PRINT_FOOTER_CHANGED_EXPLANATION,
} from './dateFormatters';

/**
 * Shared footer for look-ahead and custom print reports. Styles live in
 * `printStyles.ts` (`.corpcal-print-page-footer`) so PDF and preview match.
 */
export function PrintPageFooter({ generatedAt }: { generatedAt: Date }) {
  return (
    <footer className="corpcal-print-page-footer">
      <div className="corpcal-print-page-footer-line corpcal-print-page-footer-confidential">
        DRAFT AND CONFIDENTIAL
      </div>
      <div className="corpcal-print-page-footer-line corpcal-print-page-footer-timestamp">
        {formatPrintReportGeneratedAt(generatedAt)}
      </div>
      <div className="corpcal-print-page-footer-line corpcal-print-page-footer-hint">
        {PRINT_FOOTER_CHANGED_EXPLANATION}
      </div>
    </footer>
  );
}
