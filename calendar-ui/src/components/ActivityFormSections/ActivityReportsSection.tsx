import { UseFormReturn } from 'react-hook-form';
import { useMemo } from 'react';

import type { ActivityFormData } from '@corpcal/shared/schemas';

import {
  lookAheadSectionOptions,
  lookAheadStatusOptions,
} from '../../constants/form-options';
import { useReports } from '../../hooks/useLookups';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Textarea } from '../ui/textarea';
import { ActivityFormSection } from './ActivityFormSection';

type ActivityReportsSectionProps = {
  form: UseFormReturn<ActivityFormData>;
};

export const ActivityReportsSection: React.FC<ActivityReportsSectionProps> = ({
  form,
}) => {
  const { data: reports, isLoading: reportsLoading } = useReports();

  // Find report IDs for Look Ahead and 30/60/90 reports
  // TODO: Add system reports constants to @corpcal/shared/constants/constants
  // const lookAheadReport = useMemo(
  //   () => reports?.find((r) => r.name === 'look-ahead'),
  //   [reports]
  // );
  const thirtySixtyNinetyReport = useMemo(
    () => reports?.find((r) => r.name === 'thirty-sixty-ninety'),
    [reports]
  );

  return (
    <ActivityFormSection title="Reports">
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
            field.onChange(updatedSettings);
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
                    <FormControl>
                      <Checkbox
                        id="thirty-sixty-ninety"
                        checked={!thirtySixtyNinetyOmitted}
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
                      className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
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

      <div className="my-6 border-t border-gray-300"></div>

      {/* Look Ahead Section Title */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Look ahead</h2>

        {/* Executive Summary */}
        <FormField
          control={form.control}
          name="executiveSummary"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Executive summary</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  value={field.value || ''}
                  placeholder="Enter executive summary"
                  rows={4}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Report Status Radio Buttons */}
        <FormField
          control={form.control}
          name="lookAheadStatus"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Report Status</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value || ''}
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
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="lookAheadSection"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Section</FormLabel>
            <div className="flex flex-wrap gap-2">
              {lookAheadSectionOptions.map((option) => {
                const isSelected = field.value === option.value;
                return (
                  <Badge
                    key={option.value}
                    variant={isSelected ? 'default' : 'outline'}
                    className="cursor-pointer px-4 py-2 text-sm"
                    onClick={() => {
                      // Toggle: if already selected, set to null; otherwise set to the option value
                      const newValue = isSelected ? null : option.value;
                      field.onChange(newValue);
                    }}
                  >
                    {option.label}
                  </Badge>
                );
              })}
            </div>
            <FormDescription className="mt-2">
              Select the look ahead section
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </ActivityFormSection>
  );
};
