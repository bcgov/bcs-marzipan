import { Calendar } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';

import type { CreateActivityRequest } from '@corpcal/shared/schemas';

import { useDateStatuses, useTimeStatuses } from '../../hooks/useLookups';
import { Checkbox } from '../ui/checkbox';
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

  // Get current status IDs
  const currentDateStatusId = form.watch('dateStatusId');
  const currentTimeStatusId = form.watch('timeStatusId');

  // Find "confirmed" status by name
  const confirmedDateStatus = dateStatuses?.find((s) => s.name === 'confirmed');
  const confirmedTimeStatus = timeStatuses?.find((s) => s.name === 'confirmed');

  // Check if date/time are confirmed
  const isDateConfirmed = currentDateStatusId === confirmedDateStatus?.id;
  const isTimeConfirmed = currentTimeStatusId === confirmedTimeStatus?.id;

  // Toggle confirmation status
  const toggleDateConfirmation = () => {
    if (!dateStatuses) return;
    const unconfirmedStatus = dateStatuses.find((s) => s.name === 'unknown');
    if (isDateConfirmed && unconfirmedStatus) {
      form.setValue('dateStatusId', unconfirmedStatus.id as number);
    } else if (confirmedDateStatus) {
      form.setValue('dateStatusId', confirmedDateStatus.id as number);
    }
  };

  const toggleTimeConfirmation = () => {
    if (!timeStatuses) return;
    const unconfirmedStatus = timeStatuses.find((s) => s.name === 'unknown');
    if (isTimeConfirmed && unconfirmedStatus) {
      form.setValue('timeStatusId', unconfirmedStatus.id as number);
    } else if (confirmedTimeStatus) {
      form.setValue('timeStatusId', confirmedTimeStatus.id as number);
    }
  };

  return (
    <ActivityFormSection title="Date">
      {/* Date Range Input with Confirmation Checkbox */}
      <FormField
        control={form.control}
        name="startDate"
        render={({ field: startField }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-1">
              Date <span className="text-destructive">*</span>
            </FormLabel>
            <div className="flex items-center gap-2">
              <FormControl>
                <div className="relative flex flex-1 items-center gap-2">
                  <Input
                    type="date"
                    {...startField}
                    value={startField.value || ''}
                    className="flex-1"
                  />
                  <span className="text-muted-foreground">—</span>
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field: endField }) => (
                      <Input
                        type="date"
                        {...endField}
                        value={endField.value || ''}
                        className="flex-1"
                      />
                    )}
                  />
                  <Calendar className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2" />
                </div>
              </FormControl>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="date-confirmed"
                  checked={isDateConfirmed}
                  onCheckedChange={toggleDateConfirmation}
                />
                <label
                  htmlFor="date-confirmed"
                  className="cursor-pointer text-sm leading-none font-medium"
                >
                  Confirmed
                </label>
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
      {!form.watch('isAllDay') && (
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
                  <div className="flex flex-1 items-center gap-2">
                    <Input
                      type="time"
                      {...startTimeField}
                      value={startTimeField.value || ''}
                      className="flex-1"
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
                          className="flex-1"
                        />
                      )}
                    />
                  </div>
                </FormControl>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="time-confirmed"
                    checked={isTimeConfirmed}
                    onCheckedChange={toggleTimeConfirmation}
                  />
                  <label
                    htmlFor="time-confirmed"
                    className="cursor-pointer text-sm leading-none font-medium"
                  >
                    Confirmed
                  </label>
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
