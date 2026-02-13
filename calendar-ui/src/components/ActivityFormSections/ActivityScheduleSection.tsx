import { UseFormReturn, useWatch } from 'react-hook-form';

import type { CreateActivityRequest } from '@corpcal/shared/schemas';

import { useDateStatuses, useTimeStatuses } from '../../hooks/useLookups';
import {
  CONFIRMED_STATUS_LABEL,
  CONFIRMED_STATUS_NAMES,
  findStatusByName,
  UNCONFIRMED_STATUS_LABEL,
  UNCONFIRMED_STATUS_NAMES,
} from '../../lib/utils';
import { Button } from '../ui/button';
import { DateRangePicker } from '../ui/date-range-picker';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { Input } from '../ui/input';
import { Switch } from '../ui/switch';
import { Textarea } from '../ui/textarea';
import { ActivityFormSection } from './ActivityFormSection';

type FormData = CreateActivityRequest;

type ActivityScheduleSectionProps = {
  form: UseFormReturn<FormData>;
};

export const ActivityScheduleSection: React.FC<
  ActivityScheduleSectionProps
> = ({ form }) => {
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
    <ActivityFormSection title="Date">
      {/* Date Range Input with Confirmation Checkbox */}
      <FormField
        control={form.control}
        name="startDate"
        render={() => (
          <FormItem>
            <FormLabel className="flex items-center gap-1">
              Date <span className="text-destructive">*</span>
            </FormLabel>
            <div className="flex items-center gap-2">
              <FormControl>
                <DateRangePicker
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
              <div className="flex items-center">
                <Button
                  type="button"
                  size="sm"
                  variant={isDateConfirmed ? 'default' : 'outline'}
                  className="h-8 rounded-full px-3 text-xs whitespace-nowrap"
                  onClick={toggleDateConfirmation}
                  aria-pressed={isDateConfirmed}
                >
                  {isDateConfirmed
                    ? CONFIRMED_STATUS_LABEL
                    : UNCONFIRMED_STATUS_LABEL}
                </Button>
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
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>
        )}
      />

      {/* Time Range Input with Confirmation Checkbox */}
      {!isAllDay && (
        <FormField
          control={form.control}
          name="startTime"
          render={({ field: startTimeField }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-1">
                Time <span className="text-destructive">*</span>
              </FormLabel>
              <div className="flex items-center gap-2">
                <FormControl>
                  <div className="flex w-full max-w-[18rem] items-center gap-2">
                    <Input
                      type="time"
                      {...startTimeField}
                      value={startTimeField.value || ''}
                      className="min-w-0 flex-1"
                    />
                    <span className="text-muted-foreground">—</span>
                    <FormField
                      control={form.control}
                      name="endTime"
                      render={({ field: endTimeField }) => (
                        <Input
                          type="time"
                          {...endTimeField}
                          value={endTimeField.value || ''}
                          className="min-w-0 flex-1"
                        />
                      )}
                    />
                  </div>
                </FormControl>
                <div className="flex items-center">
                  <Button
                    type="button"
                    size="sm"
                    variant={isTimeConfirmed ? 'default' : 'outline'}
                    className="h-8 rounded-full px-3 text-xs"
                    onClick={toggleTimeConfirmation}
                    aria-pressed={isTimeConfirmed}
                  >
                    {isTimeConfirmed
                      ? CONFIRMED_STATUS_LABEL
                      : UNCONFIRMED_STATUS_LABEL}
                  </Button>
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
            <FormControl>
              <Textarea
                placeholder="Enter scheduling considerations"
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
