import { format, startOfDay } from 'date-fns';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { useState } from 'react';

import type {
  DateStatusLookupItem,
  TimeStatusLookupItem,
} from '@corpcal/shared/api/types';
import type { ActivityFormData } from '@corpcal/shared/schemas';
import { FormSelect, FormSelectTrigger } from '@/components/app/form-select';
import { Button } from '@/components/ui/button';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { ScheduledDatePopoverField } from '@/components/ui/scheduled-date-popover-field';
import { SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { TwelveHourTimeField } from '@/components/ui/twelve-hour-time-field';
import { getActivityFieldLabel } from '@/lib/activity-form-labels';
import { ACTIVITY_FORM_SECTION_LABELS } from '@/lib/activity-form-section-labels';
import {
  parseIsoDateLocal,
  PRESETS_FUTURE_FROM_ANCHOR,
  PRESETS_PAST_FROM_ANCHOR,
} from '@/lib/scheduled-date-presets';

import { useActivityEdit } from '../activity-edit-context';
import { ActivityFormSection } from './ActivityFormSection';

const STATUS_SELECT_MIN_WIDTH = 'min-w-[9rem]';

/** Inline status next to date/time: FormItem's default space-y-2 adds margin above the control when an sr-only label is present; disable vertical gap so rows align. */
const INLINE_STATUS_FORM_ITEM_CLASS = 'shrink-0 space-y-0';

const PRIMARY_AND_STATUS_ROW_CLASS =
  'grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center';

const setDateOpts = {
  shouldDirty: true,
  shouldTouch: true,
  shouldValidate: true,
} as const;

const anchorToday = () => startOfDay(new Date());

type ActivityScheduleSectionProps = {
  dateStatuses: DateStatusLookupItem[];
  timeStatuses: TimeStatusLookupItem[];
};

export function ActivityScheduleSection({
  dateStatuses,
  timeStatuses,
}: ActivityScheduleSectionProps) {
  const { readOnly } = useActivityEdit();
  const form = useFormContext<ActivityFormData>();
  const [activeTimePopover, setActiveTimePopover] = useState<
    'start' | 'end' | null
  >(null);

  const isAllDay = useWatch({ control: form.control, name: 'isAllDay' });
  const startDateValue = useWatch({ control: form.control, name: 'startDate' });
  const endDateValue = useWatch({ control: form.control, name: 'endDate' });
  const startStr = String(startDateValue ?? '');
  const endStr = String(endDateValue ?? '');

  const endPresetAnchor = () =>
    startStr ? startOfDay(parseIsoDateLocal(startStr)) : startOfDay(new Date());

  const startButtonLabel = startStr
    ? format(parseIsoDateLocal(startStr), 'MMM d, yyyy')
    : 'Select start date';
  const endButtonLabel = endStr
    ? format(parseIsoDateLocal(endStr), 'MMM d, yyyy')
    : 'Select end date';

  const isEndBeforeStart = (date: Date) =>
    Boolean(startStr && date < new Date(startStr + 'T00:00:00'));

  return (
    <ActivityFormSection title={ACTIVITY_FORM_SECTION_LABELS.schedule}>
      <FormItem>
        <FormLabel className="flex items-center gap-1">
          Date <span className="text-destructive">*</span>
        </FormLabel>
        <div className={PRIMARY_AND_STATUS_ROW_CLASS}>
          <div className="flex min-w-0 items-center gap-2">
            <Controller
              name="startDate"
              control={form.control}
              render={({ field }) => (
                <FormControl className="min-w-0 flex-1" data-field="startDate">
                  <ScheduledDatePopoverField
                    value={field.value ?? ''}
                    onChange={(iso) => {
                      field.onChange(iso || undefined);
                      const end = form.getValues('endDate');
                      if (
                        end &&
                        iso &&
                        String(end).slice(0, 10) < iso.slice(0, 10)
                      ) {
                        form.setValue('endDate', iso, setDateOpts);
                      }
                    }}
                    label={startButtonLabel}
                    triggerMuted={!startStr}
                    readOnly={readOnly}
                    popoverTitle="Select start date"
                    presets={PRESETS_PAST_FROM_ANCHOR}
                    getPresetAnchor={anchorToday}
                    triggerAriaLabel="Activity start date"
                    triggerVariant="form"
                    headerRight={
                      startStr && !readOnly ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-primary text-sm"
                          onClick={() => field.onChange(undefined)}
                        >
                          Clear
                        </Button>
                      ) : null
                    }
                  />
                </FormControl>
              )}
            />
            <span className="text-muted-foreground shrink-0" aria-hidden>
              →
            </span>
            <Controller
              name="endDate"
              control={form.control}
              render={({ field }) => (
                <FormControl className="min-w-0 flex-1" data-field="endDate">
                  {/**
                   * End-date presets are relative to the selected start date when set;
                   * otherwise the anchor is today (calendar-style default).
                   */}
                  <ScheduledDatePopoverField
                    value={field.value ?? ''}
                    onChange={(iso) => field.onChange(iso || undefined)}
                    label={endButtonLabel}
                    triggerMuted={!endStr}
                    readOnly={readOnly}
                    popoverTitle="Select end date"
                    presets={PRESETS_FUTURE_FROM_ANCHOR}
                    getPresetAnchor={endPresetAnchor}
                    isDateDisabled={isEndBeforeStart}
                    triggerAriaLabel="Activity end date"
                    triggerVariant="form"
                    headerRight={
                      endStr && !readOnly ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-primary text-sm"
                          onClick={() => field.onChange(undefined)}
                        >
                          Clear
                        </Button>
                      ) : null
                    }
                  />
                </FormControl>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="dateStatusId"
            render={({ field: statusField }) => (
              <FormItem className={INLINE_STATUS_FORM_ITEM_CLASS}>
                <FormLabel className="sr-only">
                  {getActivityFieldLabel(statusField.name)}
                </FormLabel>
                <FormSelect
                  readOnly={readOnly}
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
                    <FormSelectTrigger
                      readOnly={readOnly}
                      className={STATUS_SELECT_MIN_WIDTH}
                      aria-label={getActivityFieldLabel(statusField.name)}
                    >
                      <SelectValue placeholder="Date status" />
                    </FormSelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {dateStatuses.map((status) => (
                      <SelectItem key={status.id} value={String(status.id)}>
                        {status.displayName ?? status.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </FormSelect>
              </FormItem>
            )}
          />
        </div>
        {form.formState.errors.startDate?.message ? (
          <p className="text-destructive text-sm font-medium">
            {String(form.formState.errors.startDate.message)}
          </p>
        ) : null}
        {form.formState.errors.endDate?.message ? (
          <p className="text-destructive text-sm font-medium">
            {String(form.formState.errors.endDate.message)}
          </p>
        ) : null}
      </FormItem>

      <FormField
        control={form.control}
        name="isAllDay"
        render={({ field }) => (
          <FormItem className="space-y-0">
            <div className="flex flex-row items-center gap-2">
              <FormControl>
                <Switch
                  id="activity-schedule-all-day"
                  checked={!!field.value}
                  readOnly={readOnly}
                  onCheckedChange={(checked) => {
                    field.onChange(checked);
                  }}
                />
              </FormControl>
              <FormLabel
                className="mt-0! cursor-pointer font-normal"
                htmlFor="activity-schedule-all-day"
              >
                {getActivityFieldLabel('isAllDay')}
              </FormLabel>
            </div>
          </FormItem>
        )}
      />

      {!isAllDay ? (
        <FormItem>
          <FormLabel className="flex items-center gap-1">
            Time <span className="text-destructive">*</span>
          </FormLabel>
          <div className={PRIMARY_AND_STATUS_ROW_CLASS}>
            <div className="flex min-w-0 items-center gap-2">
              <Controller
                name="startTime"
                control={form.control}
                render={({ field }) => (
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <FormLabel className="sr-only">
                      {getActivityFieldLabel('startTime')}
                    </FormLabel>
                    <FormControl data-field="startTime">
                      <TwelveHourTimeField
                        ariaLabel="Activity start time"
                        readOnly={readOnly}
                        placeholderMuted={!String(field.value ?? '').trim()}
                        value={String(field.value ?? '')}
                        onChange={(next) =>
                          field.onChange(
                            next === undefined || next === '' ? undefined : next
                          )
                        }
                        popoverOpen={activeTimePopover === 'start'}
                        onPopoverOpenChange={(open) => {
                          if (open) setActiveTimePopover('start');
                          else
                            setActiveTimePopover((prev) =>
                              prev === 'start' ? null : prev
                            );
                        }}
                      />
                    </FormControl>
                  </div>
                )}
              />
              <span className="text-muted-foreground shrink-0" aria-hidden>
                →
              </span>
              <Controller
                name="endTime"
                control={form.control}
                render={({ field }) => (
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <FormLabel className="sr-only">
                      {getActivityFieldLabel('endTime')}
                    </FormLabel>
                    <FormControl data-field="endTime">
                      <TwelveHourTimeField
                        ariaLabel="Activity end time"
                        readOnly={readOnly}
                        placeholderMuted={!String(field.value ?? '').trim()}
                        value={String(field.value ?? '')}
                        onChange={(next) =>
                          field.onChange(
                            next === undefined || next === '' ? undefined : next
                          )
                        }
                        popoverOpen={activeTimePopover === 'end'}
                        onPopoverOpenChange={(open) => {
                          if (open) setActiveTimePopover('end');
                          else
                            setActiveTimePopover((prev) =>
                              prev === 'end' ? null : prev
                            );
                        }}
                      />
                    </FormControl>
                  </div>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="timeStatusId"
              render={({ field: statusField }) => (
                <FormItem className={INLINE_STATUS_FORM_ITEM_CLASS}>
                  <FormLabel className="sr-only">
                    {getActivityFieldLabel(statusField.name)}
                  </FormLabel>
                  <FormSelect
                    readOnly={readOnly}
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
                      <FormSelectTrigger
                        readOnly={readOnly}
                        className={STATUS_SELECT_MIN_WIDTH}
                        aria-label={getActivityFieldLabel(statusField.name)}
                      >
                        <SelectValue placeholder="Time status" />
                      </FormSelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {timeStatuses.map((status) => (
                        <SelectItem key={status.id} value={String(status.id)}>
                          {status.displayName ?? status.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </FormSelect>
                </FormItem>
              )}
            />
          </div>
          {form.formState.errors.startTime?.message ? (
            <p className="text-destructive text-sm font-medium">
              {String(form.formState.errors.startTime.message)}
            </p>
          ) : null}
          {form.formState.errors.endTime?.message ? (
            <p className="text-destructive text-sm font-medium">
              {String(form.formState.errors.endTime.message)}
            </p>
          ) : null}
        </FormItem>
      ) : null}

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
}
