import { UseFormReturn } from 'react-hook-form';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from '../ui/form';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  lookAheadStatusOptions,
  lookAheadSectionOptions,
} from '../../constants/form-options';
import { useReports } from '../../hooks/useLookups';
import type { CreateActivityRequest } from '@corpcal/shared/schemas';
import { ActivityFormSection } from './ActivityFormSection';
import { useMemo } from 'react';

type FormData = CreateActivityRequest;

type ActivityReportsSectionProps = {
  form: UseFormReturn<FormData>;
};

export const ActivityReportsSection: React.FC<ActivityReportsSectionProps> = ({
  form,
}) => {
  const { data: reports, isLoading: reportsLoading } = useReports();

  // Find report IDs for Look Ahead and 30/60/90 reports
  const lookAheadReport = useMemo(
    () => reports?.find((r) => r.name === 'look-ahead'),
    [reports]
  );
  const thirtySixtyNinetyReport = useMemo(
    () => reports?.find((r) => r.name === 'thirty-sixty-ninety'),
    [reports]
  );

  return (
    <ActivityFormSection title="Reports">
      {/* Confidential Toggle */}
      <FormField
        control={form.control}
        name="isConfidential"
        render={({ field }) => (
          <FormItem>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <FormLabel>Confidential</FormLabel>
                <FormDescription className="text-sm">
                  Confidential activities will show as placeholders in reports
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value ?? false}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="reportSettings"
        render={({ field }) => {
          const reportSettings = field.value ?? [];

          // Get current omitted status for Look Ahead report
          const getLookAheadOmitted = () => {
            if (!lookAheadReport) return false;
            const setting = reportSettings.find(
              (s) => s.reportId === lookAheadReport.id
            );
            return setting?.omitted ?? false;
          };

          // Get current omitted status for 30/60/90 report
          const getThirtySixtyNinetyOmitted = () => {
            if (!thirtySixtyNinetyReport) return false;
            const setting = reportSettings.find(
              (s) => s.reportId === thirtySixtyNinetyReport.id
            );
            return setting?.omitted ?? false;
          };

          const lookAheadOmitted = getLookAheadOmitted();
          const thirtySixtyNinetyOmitted = getThirtySixtyNinetyOmitted();

          // Update report settings when switches change
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
            <div className="space-y-6">
              {/* Look Ahead Switch */}
              {lookAheadReport && (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel>Include in Look Ahead</FormLabel>
                      {lookAheadOmitted && (
                        <FormDescription className="text-sm">
                          This activity will be omitted from the Look Ahead
                          report
                        </FormDescription>
                      )}
                    </div>
                    <FormControl>
                      <Switch
                        checked={!lookAheadOmitted}
                        onCheckedChange={(checked) => {
                          updateReportSetting(lookAheadReport.id, !checked);
                        }}
                      />
                    </FormControl>
                  </div>
                </FormItem>
              )}

              {/* 30/60/90 Switch */}
              {thirtySixtyNinetyReport && (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel>Include in 30/60/90</FormLabel>
                      {thirtySixtyNinetyOmitted && (
                        <FormDescription className="text-sm">
                          This activity will be omitted from the 30/60/90 report
                        </FormDescription>
                      )}
                    </div>
                    <FormControl>
                      <Switch
                        checked={!thirtySixtyNinetyOmitted}
                        onCheckedChange={(checked) => {
                          updateReportSetting(
                            thirtySixtyNinetyReport.id,
                            !checked
                          );
                        }}
                      />
                    </FormControl>
                  </div>
                </FormItem>
              )}
            </div>
          );
        }}
      />

      <FormField
        control={form.control}
        name="lookAheadStatus"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Report Status</FormLabel>
            <Select onValueChange={field.onChange} value={field.value || ''}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select report status" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {lookAheadStatusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

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
