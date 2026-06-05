import { useFormContext } from 'react-hook-form';
import { useMemo } from 'react';

import type { ActivityFormData } from '@corpcal/shared/schemas';
import { Checkbox } from '@/components/ui/checkbox';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { FormSectionDivider } from '@/components/ui/form-section-divider';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { RichTextField } from '@/components/ui/rich-text-field';
import { lookAheadStatusOptions } from '@/constants/form-options';
import {
  rowsToSectionOptions,
  useLookAheadSectionRows,
} from '@/hooks/useLookAheadSectionRows';
import { useReports } from '@/hooks/useLookups';
import {
  lookAheadSectionFormValue,
  lookAheadStatusFormValue,
  optionalRadioDisplayValue,
} from '@/lib/activity-form-coerce-value';
import { getActivityFieldLabel } from '@/lib/activity-form-labels';
import { ACTIVITY_FORM_SECTION_LABELS } from '@/lib/activity-form-section-labels';
import { setActivityFormFieldValue } from '@/lib/activity-form-set-field';

import { useActivityEdit } from '../activity-edit-context';
import { ActivityFieldScopePermissionTooltip } from '../activity-field-scope-permission-tooltip';
import { useActivityFieldScopeControl } from '../use-activity-field-scope-control';
import { ActivityFormHeading } from './ActivityFormHeading';
import { ActivityFormSection } from './ActivityFormSection';

export const ActivityReportsSection: React.FC = () => {
  const { readOnly, canViewFieldScope } = useActivityEdit();
  const canViewLookAhead = canViewFieldScope?.('lookAhead') ?? false;
  const lookAheadScope = useActivityFieldScopeControl('lookAhead');
  const form = useFormContext<ActivityFormData>();
  const { data: reports, isLoading: reportsLoading } = useReports();
  const { rows: lookAheadSectionRows } = useLookAheadSectionRows();
  const lookAheadSectionOptions = useMemo(
    () => rowsToSectionOptions(lookAheadSectionRows),
    [lookAheadSectionRows]
  );

  const thirtySixtyNinetyReport = useMemo(
    () => reports?.find((r) => r.name === 'thirty-sixty-ninety'),
    [reports]
  );

  return (
    <ActivityFormSection title={ACTIVITY_FORM_SECTION_LABELS.reports}>
      <FormField
        control={form.control}
        name="reportSettings"
        render={({ field }) => {
          const reportSettings = field.value ?? [];

          // Get current omitted status for 30/60/90 report
          const getThirtySixtyNinetyOmitted = () => {
            if (!thirtySixtyNinetyReport) return false;
            const setting = reportSettings.find(
              (s) => s.reportId === thirtySixtyNinetyReport.id
            );
            return setting?.omitted ?? false;
          };

          const thirtySixtyNinetyOmitted = getThirtySixtyNinetyOmitted();

          // Update report settings when checkbox changes
          const updateReportSetting = (reportId: number, omitted: boolean) => {
            const updatedSettings = reportSettings.filter(
              (s) => s.reportId !== reportId
            );
            updatedSettings.push({ reportId, omitted });
            setActivityFormFieldValue(form, field.name, updatedSettings);
          };

          if (reportsLoading) {
            return (
              <FormItem>
                <div className="text-muted-foreground text-sm">
                  Loading reports...
                </div>
              </FormItem>
            );
          }

          return (
            <>
              {/* 30-60-90 Checkbox */}
              {thirtySixtyNinetyReport && (
                <FormItem>
                  <div className="flex items-center space-x-2">
                    <FormControl data-field={field.name}>
                      <Checkbox
                        id="thirty-sixty-ninety"
                        checked={!thirtySixtyNinetyOmitted}
                        readOnly={readOnly}
                        onCheckedChange={(checked) => {
                          updateReportSetting(
                            thirtySixtyNinetyReport.id,
                            !checked
                          );
                        }}
                      />
                    </FormControl>
                    <label
                      htmlFor="thirty-sixty-ninety"
                      className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70 peer-data-readonly:opacity-100!"
                    >
                      30-60-90
                    </label>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            </>
          );
        }}
      />

      {canViewLookAhead && (
        <>
          <FormSectionDivider />

          <ActivityFormHeading>Look Ahead</ActivityFormHeading>

          <FormField
            control={form.control}
            name="executiveSummary"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{getActivityFieldLabel(field.name)}</FormLabel>
                <ActivityFieldScopePermissionTooltip scope="lookAhead">
                  <FormControl>
                    <RichTextField
                      name={field.name}
                      value={field.value ?? ''}
                      onChange={(json) =>
                        setActivityFormFieldValue(form, field.name, json)
                      }
                      onBlur={field.onBlur}
                      placeholder="Enter executive summary"
                      readOnly={lookAheadScope.readOnly}
                      disabled={lookAheadScope.fieldScopeDisabled}
                      data-field={field.name}
                    />
                  </FormControl>
                </ActivityFieldScopePermissionTooltip>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lookAheadStatus"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{getActivityFieldLabel(field.name)}</FormLabel>
                <ActivityFieldScopePermissionTooltip scope="lookAhead">
                  <FormControl data-field={field.name}>
                    <RadioGroup
                      readOnly={lookAheadScope.readOnly}
                      disabled={lookAheadScope.fieldScopeDisabled}
                      onValueChange={(value) =>
                        setActivityFormFieldValue(
                          form,
                          field.name,
                          lookAheadStatusFormValue(value)
                        )
                      }
                      value={optionalRadioDisplayValue(field.value)}
                      className="flex flex-row space-x-4"
                    >
                      {lookAheadStatusOptions.map((option) => (
                        <div
                          key={option.value}
                          className="flex items-center space-x-2"
                        >
                          <RadioGroupItem
                            value={option.value}
                            id={`status-${option.value}`}
                          />
                          <Label
                            htmlFor={`status-${option.value}`}
                            className="cursor-pointer font-normal"
                          >
                            {option.label}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </FormControl>
                </ActivityFieldScopePermissionTooltip>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lookAheadSection"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{getActivityFieldLabel(field.name)}</FormLabel>
                <ActivityFieldScopePermissionTooltip scope="lookAhead">
                  <FormControl data-field={field.name}>
                    <RadioGroup
                      readOnly={lookAheadScope.readOnly}
                      disabled={lookAheadScope.fieldScopeDisabled}
                      onValueChange={(value) =>
                        setActivityFormFieldValue(
                          form,
                          field.name,
                          lookAheadSectionFormValue(value)
                        )
                      }
                      value={optionalRadioDisplayValue(field.value)}
                      className="flex flex-row flex-wrap gap-x-4 gap-y-2"
                    >
                      {lookAheadSectionOptions.map((option) => (
                        <div
                          key={option.value}
                          className="flex items-center gap-2"
                        >
                          <RadioGroupItem
                            value={option.value}
                            id={`lookAhead-section-${option.value}`}
                          />
                          <Label
                            htmlFor={`lookAhead-section-${option.value}`}
                            className="cursor-pointer font-normal"
                          >
                            {option.label}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </FormControl>
                </ActivityFieldScopePermissionTooltip>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      )}
    </ActivityFormSection>
  );
};
