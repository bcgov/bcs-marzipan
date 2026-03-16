import { UseFormReturn, useWatch } from 'react-hook-form';

import type { ActivityFormData } from '@corpcal/shared/schemas';
import { Checkbox } from '@/components/ui/checkbox';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { TimeRangePicker } from '@/components/ui/time-range-picker';
import { useDateStatuses, useTimeStatuses } from '@/hooks/useLookups';
import { getActivityFormSectionLabel } from '@/lib/activity-form-section-labels';
import {
  CONFIRMED_STATUS_NAMES,
  findStatusByName,
  UNCONFIRMED_STATUS_NAMES,
} from '@/lib/datetime-utils';

import { ActivityFormSection } from './ActivityFormSection';

type ActivityScheduleSectionProps = {
  form: UseFormReturn<ActivityFormData>;
  readOnly?: boolean;
};

export const ActivityScheduleSection: React.FC<
  ActivityScheduleSectionProps
> = ({ form, readOnly = false }) => {
  const { data: dateStatuses } = useDateStatuses();
  const { data: timeStatuses } = useTimeStatuses();

  const coerceStatusId = (status?: { id?: string | number }) => {
    if (status?.id == null) return undefined;
    const asNumber = Number(status.id);
    return Number.isNaN(asNumber) ? undefined : asNumber;
  };

  // Get current status IDs
  const currentDateStatusId = useWatch({
    control: form.control,
    name: 'dateStatusId',
  });
  const currentTimeStatusId = useWatch({
    control: form.control,
    name: 'timeStatusId',
  });
  const isAllDay = useWatch({ control: form.control, name: 'isAllDay' });
  const startDateValue = useWatch({ control: form.control, name: 'startDate' });
  const endDateValue = useWatch({ control: form.control, name: 'endDate' });
  const startTimeValue = useWatch({ control: form.control, name: 'startTime' });
  const endTimeValue = useWatch({ control: form.control, name: 'endTime' });

  // Find "confirmed" status by name
  const confirmedDateStatus = findStatusByName(
    dateStatuses,
    CONFIRMED_STATUS_NAMES
  );
  const confirmedTimeStatus = findStatusByName(
    timeStatuses,
    CONFIRMED_STATUS_NAMES
  );

  // Check if date/time are confirmed
  const confirmedDateStatusId = coerceStatusId(confirmedDateStatus);
  const confirmedTimeStatusId = coerceStatusId(confirmedTimeStatus);
  const isDateConfirmed =
    confirmedDateStatusId !== undefined &&
    Number(currentDateStatusId) === confirmedDateStatusId;
  const isTimeConfirmed =
    confirmedTimeStatusId !== undefined &&
    Number(currentTimeStatusId) === confirmedTimeStatusId;

  // Toggle confirmation status
  const toggleDateConfirmation = () => {
    if (!dateStatuses) return;
    const unconfirmedStatus = findStatusByName(
      dateStatuses,
      UNCONFIRMED_STATUS_NAMES
    );
    if (isDateConfirmed && unconfirmedStatus) {
      const unconfirmedId = coerceStatusId(unconfirmedStatus);
      if (unconfirmedId !== undefined) {
        form.setValue('dateStatusId', unconfirmedId, {
          shouldDirty: true,
          shouldTouch: true,
        });
      }
    } else if (confirmedDateStatusId !== undefined) {
      form.setValue('dateStatusId', confirmedDateStatusId, {
        shouldDirty: true,
        shouldTouch: true,
      });
    }
  };

  const toggleTimeConfirmation = () => {
    if (!timeStatuses) return;
    const unconfirmedStatus = findStatusByName(
      timeStatuses,
      UNCONFIRMED_STATUS_NAMES
    );
    if (isTimeConfirmed && unconfirmedStatus) {
      const unconfirmedId = coerceStatusId(unconfirmedStatus);
      if (unconfirmedId !== undefined) {
        form.setValue('timeStatusId', unconfirmedId, {
          shouldDirty: true,
          shouldTouch: true,
        });
      }
    } else if (confirmedTimeStatusId !== undefined) {
      form.setValue('timeStatusId', confirmedTimeStatusId, {
        shouldDirty: true,
        shouldTouch: true,
      });
    }
  };

  return (
    <ActivityFormSection title={getActivityFormSectionLabel('date')}>
      {/* Date Range Input with Confirmation Checkbox */}
      <FormField
        control={form.control}
        name="startDate"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-1">
              Date <span className="text-destructive">*</span>
            </FormLabel>
            <div className="flex items-center gap-4">
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
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={isDateConfirmed}
                  disabled={readOnly}
                  onCheckedChange={toggleDateConfirmation}
                />
                <FormLabel className="mt-0">Confirmed</FormLabel>
              </div>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* All Day Toggle */}
      <FormField
        control={form.control}
        name="isAllDay"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between">
            <div className="space-y-0.5">
              <FormLabel>All day</FormLabel>
            </div>
            <FormControl data-field={field.name}>
              <Switch
                checked={field.value}
                disabled={readOnly}
                onCheckedChange={field.onChange}
              />
            </FormControl>
          </FormItem>
        )}
      />

      {/* Time Range Input with Confirmation Checkbox */}
      {!isAllDay && (
        <FormField
          control={form.control}
          name="startTime"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-1">
                Time <span className="text-destructive">*</span>
              </FormLabel>
              <div className="flex items-center gap-4">
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
                  />
                </FormControl>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={isTimeConfirmed}
                    disabled={readOnly}
                    onCheckedChange={toggleTimeConfirmation}
                  />
                  <FormLabel className="mt-0">Confirmed</FormLabel>
                </div>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {/* Scheduling Considerations */}
      <FormField
        control={form.control}
        name="schedulingNotes"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-1">
              Scheduling considerations
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
