import { useEffect, useState } from 'react';

import { AdminModal } from '@/components/admin';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

type EditReportFieldRow = {
  id: string;
  name: string;
  selected: boolean;
  label: string;
};

type EditReportSection = {
  title: string;
  fields: EditReportFieldRow[];
};

function createInitialEditReportSections(): EditReportSection[] {
  return [
    {
      title: 'General',
      fields: [
        { id: 'title', name: 'Title', selected: true, label: 'Title' },
        { id: 'summary', name: 'Summary', selected: true, label: 'Summary' },
      ],
    },
    {
      title: 'Scheduling',
      fields: [
        {
          id: 'startDate',
          name: 'Start Date',
          selected: true,
          label: 'Start Date',
        },
        { id: 'time', name: 'Time', selected: true, label: 'Time' },
      ],
    },
  ];
}

export interface EditReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Scaffold for customizing custom report columns/labels. Uses the same {@link AdminModal}
 * pattern as Settings admin sections (e.g. Categories).
 */
export function EditReportModal({ open, onOpenChange }: EditReportModalProps) {
  const [sections, setSections] = useState(createInitialEditReportSections);

  useEffect(() => {
    if (open) {
      setSections(createInitialEditReportSections());
    }
  }, [open]);

  const setFieldSelected = (
    sectionIndex: number,
    fieldId: string,
    selected: boolean
  ) => {
    setSections((prev) =>
      prev.map((section, si) =>
        si !== sectionIndex
          ? section
          : {
              ...section,
              fields: section.fields.map((f) =>
                f.id === fieldId ? { ...f, selected } : f
              ),
            }
      )
    );
  };

  const setFieldLabel = (
    sectionIndex: number,
    fieldId: string,
    label: string
  ) => {
    setSections((prev) =>
      prev.map((section, si) =>
        si !== sectionIndex
          ? section
          : {
              ...section,
              fields: section.fields.map((f) =>
                f.id === fieldId ? { ...f, label } : f
              ),
            }
      )
    );
  };

  const handleSave = () => {
    console.log('Save clicked');
    onOpenChange(false);
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
        {sections.map((section, sectionIndex) => (
          <div
            key={section.title}
            className={cn(sectionIndex > 0 && 'border-border border-t pt-6')}
          >
            <h3 className="text-foreground mb-3 text-sm font-semibold">
              Section: {section.title}
            </h3>
            <div className="space-y-3">
              {section.fields.map((field) => {
                const controlId = `edit-report-field-${field.id}`;
                return (
                  <div
                    key={field.id}
                    className="flex flex-wrap items-center gap-3 sm:flex-nowrap"
                  >
                    <div className="flex shrink-0 items-center gap-2">
                      <Checkbox
                        id={controlId}
                        checked={field.selected}
                        onCheckedChange={(checked) =>
                          setFieldSelected(
                            sectionIndex,
                            field.id,
                            checked === true
                          )
                        }
                        aria-label={`Include ${field.name}`}
                      />
                      <Label
                        htmlFor={controlId}
                        className="text-sm font-medium text-slate-700"
                      >
                        {field.name}
                      </Label>
                    </div>
                    <Input
                      value={field.label}
                      onChange={(e) =>
                        setFieldLabel(sectionIndex, field.id, e.target.value)
                      }
                      placeholder="Column label"
                      className="min-w-0 flex-1 sm:max-w-[220px]"
                      aria-label={`Label for ${field.name}`}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </AdminModal>
  );
}
