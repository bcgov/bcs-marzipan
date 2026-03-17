import { UseFormReturn, useWatch } from 'react-hook-form';

import type { ActivityFormData } from '@corpcal/shared/schemas';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { TimeRangePicker } from '@/components/ui/time-range-picker';
import { useDateStatuses, useTimeStatuses } from '@/hooks/useLookups';
import { getActivityFieldLabel } from '@/lib/activity-form-labels';
import { ACTIVITY_FORM_SECTION_LABELS } from '@/lib/activity-form-section-labels';

import { ActivityFormSection } from './ActivityFormSection';

const STATUS_SELECT_MIN_WIDTH = 'min-w-[9rem]';

type ActivityScheduleSectionProps = {
  form: UseFormReturn<ActivityFormData>;
  readOnly?: boolean;
};

export const ActivityScheduleSection: React.FC<
  ActivityScheduleSectionProps
> = ({ form, readOnly = false }) => {
  const { data: dateStatuses } = useDateStatuses();
  const { data: timeStatuses } = useTimeStatuses();

  const isAllDay = useWatch({ control: form.control, name: 'isAllDay' });
  const startDateValue = useWatch({ control: form.control, name: 'startDate' });
  const endDateValue = useWatch({ control: form.control, name: 'endDate' });
  const startTimeValue = useWatch({ control: form.control, name: 'startTime' });
  const endTimeValue = useWatch({ control: form.control, name: 'endTime' });

  return (
    <ActivityFormSection title={ACTIVITY_FORM_SECTION_LABELS.date}>
      {/* Date Range and Date Status */}
      <FormField
        control={form.control}
        name="startDate"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-1">
              {getActivityFieldLabel(field.name)}{' '}
              <span className="text-destructive">*</span>
            </FormLabel>
            <div className="flex flex-wrap items-center gap-4">
              <div className="min-w-0 flex-1">
                <FormControl data-field={field.name}>
                  <DateRangePicker
                    disabled={readOnly}
                    startDate={String(startDateValue || '')}
                    endDate={String(endDateValue || '')}
                    onStartDateChange={(date) => {
                      form.setValue('startDate', date, {
                        shouldDirty: true,
                        shouldTouch: true,
                      });
                    }}
                    onEndDateChange={(date) => {
                      form.setValue('endDate', date, {
                        shouldDirty: true,
                        shouldTouch: true,
                      });
                    }}
                    placeholder="Pick a date"
                  />
                </FormControl>
              </div>
              <FormField
                control={form.control}
                name="dateStatusId"
                render={({ field: statusField }) => (
                  <FormItem className="shrink-0">
                    <FormLabel className="sr-only">
                      {getActivityFieldLabel(statusField.name)}
                    </FormLabel>
                    <Select
                      disabled={readOnly}
                      value={
                        statusField.value !== undefined &&
                        statusField.value !== null
                          ? String(statusField.value)
                          : ''
                      }
                      onValueChange={(value) =>
                        statusField.onChange(
                          value === '' ? undefined : Number(value)
                        )
                      }
                    >
                      <FormControl data-field={statusField.name}>
                        <SelectTrigger
                          className={STATUS_SELECT_MIN_WIDTH}
                          aria-label={getActivityFieldLabel(statusField.name)}
                        >
                          <SelectValue placeholder="Date status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(dateStatuses ?? []).map((status) => (
                          <SelectItem key={status.id} value={String(status.id)}>
                            {status.displayName ?? status.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Time Range and Time Status (All day toggle is inside TimeRangePicker) */}
      <FormField
        control={form.control}
        name="startTime"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-1">
              {getActivityFieldLabel(field.name)}{' '}
              <span className="text-destructive">*</span>
            </FormLabel>
            <div className="flex flex-wrap items-center gap-4">
              <div className="min-w-0 flex-1">
                <FormControl data-field={field.name}>
                  <TimeRangePicker
                    disabled={readOnly}
                    startTime={String(startTimeValue || '')}
                    endTime={String(endTimeValue || '')}
                    onStartTimeChange={(time) => {
                      form.setValue('startTime', time, {
                        shouldDirty: true,
                        shouldTouch: true,
                      });
                    }}
                    onEndTimeChange={(time) => {
                      form.setValue('endTime', time, {
                        shouldDirty: true,
                        shouldTouch: true,
                      });
                    }}
                    placeholder="Pick a time range"
                    isAllDay={!!isAllDay}
                    onAllDayChange={(checked) => {
                      form.setValue('isAllDay', checked, {
                        shouldDirty: true,
                        shouldTouch: true,
                      });
                    }}
                    allDayLabel={getActivityFieldLabel('isAllDay')}
                    allDayDisabled={readOnly}
                  />
                </FormControl>
              </div>
              <FormField
                control={form.control}
                name="timeStatusId"
                render={({ field: statusField }) => (
                  <FormItem className="shrink-0">
                    <FormLabel className="sr-only">
                      {getActivityFieldLabel(statusField.name)}
                    </FormLabel>
                    <Select
                      disabled={readOnly}
                      value={
                        statusField.value !== undefined &&
                        statusField.value !== null
                          ? String(statusField.value)
                          : ''
                      }
                      onValueChange={(value) =>
                        statusField.onChange(
                          value === '' ? undefined : Number(value)
                        )
                      }
                    >
                      <FormControl data-field={statusField.name}>
                        <SelectTrigger
                          className={STATUS_SELECT_MIN_WIDTH}
                          aria-label={getActivityFieldLabel(statusField.name)}
                        >
                          <SelectValue placeholder="Time status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(timeStatuses ?? []).map((status) => (
                          <SelectItem key={status.id} value={String(status.id)}>
                            {status.displayName ?? status.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Scheduling Considerations */}
      <FormField
        control={form.control}
        name="schedulingNotes"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-1">
              {getActivityFieldLabel(field.name)}
              <span className="text-muted-foreground ml-1">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="inline-block"
                >
                  <circle
                    cx="8"
                    cy="8"
                    r="7"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M8 7V11M8 5V5.01"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </FormLabel>
            <FormControl data-field={field.name}>
              <Textarea
                placeholder="Enter scheduling considerations"
                readOnly={readOnly}
                rows={4}
                {...field}
                value={field.value || ''}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </ActivityFormSection>
  );
};
