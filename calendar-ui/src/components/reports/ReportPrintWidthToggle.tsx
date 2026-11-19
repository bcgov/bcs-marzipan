import { Checkbox } from '@/components/ui/checkbox';
import type { ReportPreviewSheetWidthMode } from '@/hooks/useReportPreviewSheetWidth';

export interface ReportPrintWidthToggleProps {
  mode: ReportPreviewSheetWidthMode;
  onModeChange: (mode: ReportPreviewSheetWidthMode) => void;
}

export function ReportPrintWidthToggle({
  mode,
  onModeChange,
}: ReportPrintWidthToggleProps) {
  return (
    <label className="text-foreground flex shrink-0 cursor-pointer items-center gap-2 text-sm">
      <Checkbox
        checked={mode === 'print'}
        onCheckedChange={(checked) => onModeChange(checked ? 'print' : 'full')}
        aria-label="Print width"
      />
      Print width
    </label>
  );
}
