import {
  CUSTOM_REPORT_SECTIONS,
  type CustomReportFieldConfig,
} from '@corpcal/shared/reports/customReportFieldConfig';
import { AdminModal } from '@/components/admin';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const SECTION_DISPLAY_ORDER = Object.values(CUSTOM_REPORT_SECTIONS);

export interface EditReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fields: CustomReportFieldConfig[];
  onFieldsChange: (fields: CustomReportFieldConfig[]) => void;
  /** Persist config and close modal (invoked when user clicks Save). */
  onSave: () => void;
}

/**
 * Custom report column picker: {@link CustomReportFieldConfig} state, grouped by section.
 * Uses the same {@link AdminModal} pattern as Settings admin sections (e.g. Categories).
 */
export function EditReportModal({
  open,
  onOpenChange,
  fields,
  onFieldsChange,
  onSave,
}: EditReportModalProps) {
  const sectionsToRender = SECTION_DISPLAY_ORDER.filter((sectionTitle) =>
    fields.some((f) => f.section === sectionTitle)
  );

  const setFieldSelected = (key: string, selected: boolean) => {
    onFieldsChange(fields.map((f) => (f.key === key ? { ...f, selected } : f)));
  };

  const setFieldLabel = (key: string, label: string) => {
    onFieldsChange(fields.map((f) => (f.key === key ? { ...f, label } : f)));
  };

  const handleSave = () => {
    onSave();
  };

  return (
    <AdminModal
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Report"
      description="Select fields and customize labels for this report"
      onConfirm={handleSave}
      confirmLabel="Save"
      cancelLabel="Cancel"
    >
      <div className="max-h-[min(60vh,28rem)] space-y-6 overflow-y-auto pr-1">
        {sectionsToRender.map((sectionTitle, sectionIndex) => {
          const sectionFields = fields.filter(
            (f) => f.section === sectionTitle
          );
          return (
            <div
              key={sectionTitle}
              className={cn(sectionIndex > 0 && 'border-border border-t pt-6')}
            >
              <h3 className="text-foreground mb-3 text-sm font-semibold">
                Section: {sectionTitle}
              </h3>
              <div className="space-y-3">
                {sectionFields.map((field) => {
                  const controlId = `edit-report-field-${field.key}`;
                  return (
                    <div
                      key={field.key}
                      className="flex flex-wrap items-center gap-3 sm:flex-nowrap"
                    >
                      <div className="flex min-w-0 shrink-0 items-center gap-2">
                        <Checkbox
                          id={controlId}
                          checked={field.selected}
                          onCheckedChange={(checked) =>
                            setFieldSelected(field.key, checked === true)
                          }
                          aria-label={`Include ${field.key}`}
                        />
                        <Label
                          htmlFor={controlId}
                          className="font-mono text-xs font-medium text-slate-700"
                        >
                          {field.key}
                        </Label>
                      </div>
                      <Input
                        value={field.label}
                        onChange={(e) =>
                          setFieldLabel(field.key, e.target.value)
                        }
                        placeholder="Column label"
                        className="min-w-0 flex-1 sm:max-w-[240px]"
                        aria-label={`Label for ${field.key}`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </AdminModal>
  );
}
