import { format, startOfDay } from 'date-fns';
import { useFormContext, useWatch } from 'react-hook-form';
import { useEffect, useState } from 'react';

import {
  CONFIRMED_LOOKUP_NAME,
  CORP_PACIFIC_LABEL,
  TBD_LOOKUP_NAME,
} from '@corpcal/shared';
import type {
  DateStatusLookupItem,
  TimeStatusLookupItem,
} from '@corpcal/shared/api/types';
import {
  ACTIVITY_SCHEDULING_NOTES_MAX_LENGTH,
  type ActivityFormData,
} from '@corpcal/shared/schemas';
import {
  FormSelectSafe,
  FormSelectTrigger,
} from '@/components/app/form-select';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  RequiredFieldIndicator,
  useFormPathsFieldHighlight,
} from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import { ScheduledDatePopoverField } from '@/components/ui/scheduled-date-popover-field';
import { SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { TimePicker } from '@/components/ui/time-picker';
import {
  optionalIdSelectDisplayValue,
  optionalSelectIdValue,
} from '@/lib/activity-form-coerce-value';
import { getActivityFieldLabel } from '@/lib/activity-form-labels';
import { ACTIVITY_FORM_SECTION_LABELS } from '@/lib/activity-form-section-labels';
import { setActivityFormFieldValue } from '@/lib/activity-form-set-field';
import { FORM_FIELD_LABEL_HIGHLIGHT_CLASS } from '@/lib/form-field-highlight';
import {
  getPresetAnchorToday,
  parseIsoDateLocal,
  PRESETS_FUTURE_FROM_ANCHOR,
  PRESETS_PAST_FROM_ANCHOR,
} from '@/lib/scheduled-date-presets';
import { cn } from '@/lib/utils';

import { useActivityEdit } from '../activity-edit-context';
import { ActivityFieldInfoIcon } from '../activity-info-icon-settings-context';
import { ActivityFormSection } from './ActivityFormSection';

/** Same flex track as start date/time; FormItem default space-y-2 disabled for sr-only labels. */
const START_COLUMN_FORM_ITEM_CLASS = 'min-w-0 flex-1 space-y-0';

/** Narrow: start + arrow on line 1, end on line 2; sm+: start → end on one row. */
const SCHEDULE_START_END_ROW_CLASS =
  'flex flex-wrap items-center gap-2 sm:flex-nowrap';

/** Keeps the range arrow on the same line as the start control below sm. */
const SCHEDULE_START_AND_ARROW_GROUP_CLASS =
  'flex min-w-0 w-full items-center gap-2 sm:contents';

/** Start/end controls with field errors under the related column (before status row). */
const SCHEDULE_START_END_GRID_CLASS =
  'grid grid-cols-[minmax(0,1fr)_auto] gap-x-2 gap-y-1 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]';

const SCHEDULE_START_FIELD_FORM_ITEM_CLASS = 'min-w-0 space-y-0';

const SCHEDULE_END_FIELD_GRID_FORM_ITEM_CLASS =
  'min-w-0 col-span-2 row-start-2 space-y-0 sm:col-span-1 sm:col-start-3 sm:row-start-1';

const SCHEDULE_FIELD_ERROR_CLASS = 'text-destructive text-sm font-medium';

function ScheduleFieldError({ message }: { message: string }) {
  return (
    <p className={SCHEDULE_FIELD_ERROR_CLASS} role="alert">
      {message}
    </p>
  );
}

function ScheduleRangeArrow() {
  return (
    <span className="text-muted-foreground shrink-0" aria-hidden>
      →
    </span>
  );
}

/** Matches {@link ScheduleRangeArrow} width for status column alignment. */
function ScheduleStatusArrowSpacer() {
  return (
    <span className="invisible shrink-0" aria-hidden>
      →
    </span>
  );
}

/** Invisible end column so status width matches start on sm+. */
function ScheduleStatusEndColumnSpacer() {
  return <div className="hidden min-w-0 flex-1 sm:block" aria-hidden />;
}

const DATE_GROUP_FIELDS = ['startDate', 'endDate', 'dateStatusId'] as const;
const TIME_GROUP_FIELDS = [
  'startTime',
  'endTime',
  'isAllDay',
  'timeStatusId',
] as const;

const parseTimeToMinutes = (value: string): number | null => {
  const [hourPart, minutePart] = value.trim().split(':');
  const hours = Number.parseInt(hourPart ?? '', 10);
  const minutes = Number.parseInt(minutePart ?? '', 10);
  if (
    !Number.isFinite(hours) ||
    !Number.isFinite(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }
  return hours * 60 + minutes;
};

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
  const dateGroupHighlight = useFormPathsFieldHighlight(DATE_GROUP_FIELDS);
  const timeGroupHighlight = useFormPathsFieldHighlight(TIME_GROUP_FIELDS);
  const [activeTimePopover, setActiveTimePopover] = useState<
    'start' | 'end' | null
  >(null);

  const isAllDay = useWatch({ control: form.control, name: 'isAllDay' });
  useEffect(() => {
    if (isAllDay) {
      setActiveTimePopover((prev) => (prev === 'end' ? null : prev));
    }
  }, [isAllDay]);
  const startDateValue = useWatch({ control: form.control, name: 'startDate' });
  const endDateValue = useWatch({ control: form.control, name: 'endDate' });
  const startTimeValue = useWatch({ control: form.control, name: 'startTime' });
  const endTimeValue = useWatch({ control: form.control, name: 'endTime' });
  const startStr = String(startDateValue ?? '');
  const endStr = String(endDateValue ?? '');
  const startTimeStr = String(startTimeValue ?? '').trim();
  const endTimeStr = String(endTimeValue ?? '').trim();

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

  const hasDateOrderWarning =
    Boolean(startStr) &&
    Boolean(endStr) &&
    endStr.slice(0, 10) < startStr.slice(0, 10);
  const isSameDayOrDateUnspecified =
    !startStr || !endStr || startStr.slice(0, 10) === endStr.slice(0, 10);
  const startTimeMinutes = parseTimeToMinutes(startTimeStr);
  const endTimeMinutes = parseTimeToMinutes(endTimeStr);
  const hasTimeOrderWarning =
    !isAllDay &&
    isSameDayOrDateUnspecified &&
    startTimeStr.length > 0 &&
    endTimeStr.length > 0 &&
    startTimeMinutes !== null &&
    endTimeMinutes !== null &&
    endTimeMinutes <= startTimeMinutes;

  const hasBothDates = Boolean(startStr && endStr);
  const timeFilledForConfirmed =
    isAllDay || (startTimeStr.length > 0 && endTimeStr.length > 0);
  const tbdDateStatusId = dateStatuses.find(
    (s) => s.name === TBD_LOOKUP_NAME
  )?.id;
  const tbdTimeStatusId = timeStatuses.find(
    (s) => s.name === TBD_LOOKUP_NAME
  )?.id;
  const dateStatusIdValue = useWatch({
    control: form.control,
    name: 'dateStatusId',
  });
  const timeStatusIdValue = useWatch({
    control: form.control,
    name: 'timeStatusId',
  });

  useEffect(() => {
    if (readOnly || tbdDateStatusId == null) return;
    const current = dateStatuses.find((s) => s.id === dateStatusIdValue);
    if (
      !hasBothDates &&
      current?.name === CONFIRMED_LOOKUP_NAME &&
      dateStatusIdValue !== tbdDateStatusId
    ) {
      setActivityFormFieldValue(form, 'dateStatusId', tbdDateStatusId);
    }
  }, [
    dateStatusIdValue,
    dateStatuses,
    form,
    hasBothDates,
    readOnly,
    tbdDateStatusId,
  ]);

  useEffect(() => {
    if (readOnly || tbdTimeStatusId == null) return;
    const current = timeStatuses.find((s) => s.id === timeStatusIdValue);
    if (
      !timeFilledForConfirmed &&
      current?.name === CONFIRMED_LOOKUP_NAME &&
      timeStatusIdValue !== tbdTimeStatusId
    ) {
      setActivityFormFieldValue(form, 'timeStatusId', tbdTimeStatusId);
    }
  }, [
    form,
    readOnly,
    tbdTimeStatusId,
    timeFilledForConfirmed,
    timeStatusIdValue,
    timeStatuses,
  ]);

  const startDateErrorMessage = form.formState.errors.startDate?.message;
  const endDateErrorMessage = form.formState.errors.endDate?.message;
  const startTimeErrorMessage = form.formState.errors.startTime?.message;
  const endTimeErrorMessage = form.formState.errors.endTime?.message;

  return (
    <ActivityFormSection title={ACTIVITY_FORM_SECTION_LABELS.schedule}>
      <FormItem>
        {/* Group label — not FormLabel: not tied to one control id (nested fields each have sr-only labels). */}
        <Label className="flex items-center gap-2">
          <span
            className={cn(
              'inline-flex items-center gap-1',
              dateGroupHighlight.highlight && FORM_FIELD_LABEL_HIGHLIGHT_CLASS
            )}
          >
            Date
            <RequiredFieldIndicator className="inline" />
            {dateGroupHighlight.screenReaderText ? (
              <span className="sr-only">
                {dateGroupHighlight.screenReaderText}
              </span>
            ) : null}
          </span>
          <ActivityFieldInfoIcon
            fieldKey="startDate"
            ariaLabel="About start date"
          />
          <ActivityFieldInfoIcon
            fieldKey="endDate"
            ariaLabel="About end date"
          />
          <ActivityFieldInfoIcon
            fieldKey="dateStatusId"
            ariaLabel="About date status"
          />
        </Label>
        <div className="space-y-3">
          <div className={SCHEDULE_START_END_GRID_CLASS}>
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem
                  className={cn(
                    SCHEDULE_START_FIELD_FORM_ITEM_CLASS,
                    'col-start-1 row-start-1'
                  )}
                >
                  <FormLabel
                    className="sr-only"
                    showDirtyIndicator={false}
                    showRequired
                  >
                    {getActivityFieldLabel(field.name)}
                  </FormLabel>
                  <FormControl
                    className="min-w-0 flex-1"
                    data-field="startDate"
                  >
                    <ScheduledDatePopoverField
                      value={field.value ?? ''}
                      onChange={(iso) => {
                        setActivityFormFieldValue(
                          form,
                          field.name,
                          iso || undefined
                        );
                        const end = form.getValues('endDate');
                        if (
                          end &&
                          iso &&
                          String(end).slice(0, 10) < iso.slice(0, 10)
                        ) {
                          setActivityFormFieldValue(form, 'endDate', iso);
                        }
                      }}
                      label={startButtonLabel}
                      triggerMuted={!startStr}
                      readOnly={readOnly}
                      popoverTitle="Select start date"
                      presets={PRESETS_PAST_FROM_ANCHOR}
                      getPresetAnchor={getPresetAnchorToday}
                      triggerAriaLabel="Activity start date"
                      triggerVariant="form"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="col-start-2 row-start-1 self-center">
              <ScheduleRangeArrow />
            </div>
            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem className={SCHEDULE_END_FIELD_GRID_FORM_ITEM_CLASS}>
                  <FormLabel
                    className="sr-only"
                    showDirtyIndicator={false}
                    showRequired
                  >
                    {getActivityFieldLabel(field.name)}
                  </FormLabel>
                  <FormControl className="min-w-0 flex-1" data-field="endDate">
                    {/**
                     * End-date presets are relative to the selected start date when set;
                     * otherwise the anchor is today (calendar-style default).
                     */}
                    <ScheduledDatePopoverField
                      value={field.value ?? ''}
                      onChange={(iso) =>
                        setActivityFormFieldValue(
                          form,
                          field.name,
                          iso || undefined
                        )
                      }
                      label={endButtonLabel}
                      triggerMuted={!endStr}
                      readOnly={readOnly}
                      popoverTitle="Select end date"
                      presets={PRESETS_FUTURE_FROM_ANCHOR}
                      getPresetAnchor={endPresetAnchor}
                      isDateDisabled={isEndBeforeStart}
                      triggerAriaLabel="Activity end date"
                      triggerVariant="form"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            {startDateErrorMessage ? (
              <div className="col-start-1 row-start-3 sm:row-start-2">
                <ScheduleFieldError message={String(startDateErrorMessage)} />
              </div>
            ) : null}
            {endDateErrorMessage ? (
              <div className="col-span-2 col-start-1 row-start-4 sm:col-span-1 sm:col-start-3 sm:row-start-2">
                <ScheduleFieldError message={String(endDateErrorMessage)} />
              </div>
            ) : null}
          </div>
          {hasDateOrderWarning ? (
            <p className="text-sm font-medium text-amber-700">
              End date must be later than or equal to start date.
            </p>
          ) : null}
          <div className={SCHEDULE_START_END_ROW_CLASS}>
            <div className={SCHEDULE_START_AND_ARROW_GROUP_CLASS}>
              <FormField
                control={form.control}
                name="dateStatusId"
                render={({ field: statusField }) => (
                  <FormItem className={START_COLUMN_FORM_ITEM_CLASS}>
                    <FormLabel className="sr-only" showDirtyIndicator={false}>
                      {getActivityFieldLabel(statusField.name)}
                    </FormLabel>
                    <FormSelectSafe
                      readOnly={readOnly}
                      optionValues={dateStatuses.map((s) => String(s.id))}
                      value={optionalIdSelectDisplayValue(statusField.value)}
                      onValueChange={(value) =>
                        setActivityFormFieldValue(
                          form,
                          statusField.name,
                          optionalSelectIdValue(value)
                        )
                      }
                    >
                      <FormControl
                        className="w-full min-w-0"
                        data-field={statusField.name}
                      >
                        <FormSelectTrigger
                          readOnly={readOnly}
                          className="w-full min-w-0"
                          aria-label={getActivityFieldLabel(statusField.name)}
                        >
                          <SelectValue placeholder="" />
                        </FormSelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {dateStatuses.map((status) => {
                          const isConfirmed =
                            status.name === CONFIRMED_LOOKUP_NAME;
                          return (
                            <SelectItem
                              key={status.id}
                              value={String(status.id)}
                              disabled={isConfirmed && !hasBothDates}
                            >
                              {status.displayName ?? status.name}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </FormSelectSafe>
                  </FormItem>
                )}
              />
              <ScheduleStatusArrowSpacer />
            </div>
            <ScheduleStatusEndColumnSpacer />
          </div>
        </div>
      </FormItem>

      <FormItem>
        {/* Group label — not FormLabel: not tied to one control id (nested fields each have sr-only labels). */}
        <Label className="flex items-center gap-2">
          <span
            className={cn(
              timeGroupHighlight.highlight && FORM_FIELD_LABEL_HIGHLIGHT_CLASS
            )}
          >
            Time
            {timeGroupHighlight.screenReaderText ? (
              <span className="sr-only">
                {timeGroupHighlight.screenReaderText}
              </span>
            ) : null}
          </span>
          <ActivityFieldInfoIcon
            fieldKey="startTime"
            ariaLabel="About start time"
          />
          <ActivityFieldInfoIcon
            fieldKey="endTime"
            ariaLabel="About end time"
          />
          <ActivityFieldInfoIcon
            fieldKey="isAllDay"
            ariaLabel="About all day"
          />
          <ActivityFieldInfoIcon
            fieldKey="timeStatusId"
            ariaLabel="About time status"
          />
        </Label>
        <div className="space-y-3">
          {isAllDay ? (
            <div className="min-w-0 space-y-1">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem className="min-w-0 space-y-0">
                    <FormLabel className="sr-only" showDirtyIndicator={false}>
                      {getActivityFieldLabel('startTime')}
                    </FormLabel>
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <FormControl
                        className="min-w-0 flex-1"
                        data-field="startTime"
                      >
                        <TimePicker
                          allDay={{
                            isAllDay: !!isAllDay,
                            onAllDayChange: (checked) => {
                              setActivityFormFieldValue(
                                form,
                                'isAllDay',
                                checked
                              );
                            },
                            label: getActivityFieldLabel('isAllDay'),
                          }}
                          ariaLabel="Activity start time"
                          readOnly={readOnly}
                          placeholderMuted={false}
                          value={String(field.value ?? '')}
                          onChange={(next) =>
                            setActivityFormFieldValue(
                              form,
                              field.name,
                              next === undefined || next === ''
                                ? undefined
                                : next
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
                  </FormItem>
                )}
              />
              {startTimeErrorMessage ? (
                <ScheduleFieldError message={String(startTimeErrorMessage)} />
              ) : null}
            </div>
          ) : (
            <div className={SCHEDULE_START_END_GRID_CLASS}>
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem
                    className={cn(
                      SCHEDULE_START_FIELD_FORM_ITEM_CLASS,
                      'col-start-1 row-start-1'
                    )}
                  >
                    <FormLabel className="sr-only" showDirtyIndicator={false}>
                      {getActivityFieldLabel('startTime')}
                    </FormLabel>
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <FormControl
                        className="min-w-0 flex-1"
                        data-field="startTime"
                      >
                        <TimePicker
                          allDay={{
                            isAllDay: !!isAllDay,
                            onAllDayChange: (checked) => {
                              setActivityFormFieldValue(
                                form,
                                'isAllDay',
                                checked
                              );
                            },
                            label: getActivityFieldLabel('isAllDay'),
                          }}
                          ariaLabel="Activity start time"
                          readOnly={readOnly}
                          placeholderMuted={!String(field.value ?? '').trim()}
                          value={String(field.value ?? '')}
                          onChange={(next) =>
                            setActivityFormFieldValue(
                              form,
                              field.name,
                              next === undefined || next === ''
                                ? undefined
                                : next
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
                  </FormItem>
                )}
              />
              <div className="col-start-2 row-start-1 self-center">
                <ScheduleRangeArrow />
              </div>
              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem className={SCHEDULE_END_FIELD_GRID_FORM_ITEM_CLASS}>
                    <FormLabel className="sr-only" showDirtyIndicator={false}>
                      {getActivityFieldLabel('endTime')}
                    </FormLabel>
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <FormControl
                        className="min-w-0 flex-1"
                        data-field="endTime"
                      >
                        <TimePicker
                          allDay={{
                            isAllDay: !!isAllDay,
                            onAllDayChange: (checked) => {
                              setActivityFormFieldValue(
                                form,
                                'isAllDay',
                                checked
                              );
                            },
                            label: getActivityFieldLabel('isAllDay'),
                          }}
                          ariaLabel="Activity end time"
                          readOnly={readOnly}
                          placeholderMuted={!String(field.value ?? '').trim()}
                          value={String(field.value ?? '')}
                          onChange={(next) =>
                            setActivityFormFieldValue(
                              form,
                              field.name,
                              next === undefined || next === ''
                                ? undefined
                                : next
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
                  </FormItem>
                )}
              />
              {startTimeErrorMessage ? (
                <div className="col-start-1 row-start-3 sm:row-start-2">
                  <ScheduleFieldError message={String(startTimeErrorMessage)} />
                </div>
              ) : null}
              {endTimeErrorMessage ? (
                <div className="col-span-2 col-start-1 row-start-4 sm:col-span-1 sm:col-start-3 sm:row-start-2">
                  <ScheduleFieldError message={String(endTimeErrorMessage)} />
                </div>
              ) : null}
            </div>
          )}
          {hasTimeOrderWarning ? (
            <p className="text-sm font-medium text-amber-700">
              End time must be later than start time.
            </p>
          ) : null}
          <div className={SCHEDULE_START_END_ROW_CLASS}>
            <div className={SCHEDULE_START_AND_ARROW_GROUP_CLASS}>
              <FormField
                control={form.control}
                name="timeStatusId"
                render={({ field: statusField }) => (
                  <FormItem className={START_COLUMN_FORM_ITEM_CLASS}>
                    <FormLabel className="sr-only" showDirtyIndicator={false}>
                      {getActivityFieldLabel(statusField.name)}
                    </FormLabel>
                    <FormSelectSafe
                      readOnly={readOnly}
                      optionValues={timeStatuses.map((s) => String(s.id))}
                      value={optionalIdSelectDisplayValue(statusField.value)}
                      onValueChange={(value) =>
                        setActivityFormFieldValue(
                          form,
                          statusField.name,
                          optionalSelectIdValue(value)
                        )
                      }
                    >
                      <FormControl
                        className="w-full min-w-0"
                        data-field={statusField.name}
                      >
                        <FormSelectTrigger
                          readOnly={readOnly}
                          className="w-full min-w-0"
                          aria-label={getActivityFieldLabel(statusField.name)}
                        >
                          <SelectValue placeholder="" />
                        </FormSelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {timeStatuses.map((status) => {
                          const isConfirmed =
                            status.name === CONFIRMED_LOOKUP_NAME;
                          return (
                            <SelectItem
                              key={status.id}
                              value={String(status.id)}
                              disabled={isConfirmed && !timeFilledForConfirmed}
                            >
                              {status.displayName ?? status.name}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </FormSelectSafe>
                  </FormItem>
                )}
              />
              {!isAllDay ? <ScheduleStatusArrowSpacer /> : null}
            </div>
            {!isAllDay ? <ScheduleStatusEndColumnSpacer /> : null}
          </div>
        </div>
        {!isAllDay ? (
          <p className="text-muted-foreground mt-1.5 text-xs">
            {CORP_PACIFIC_LABEL}
          </p>
        ) : null}
      </FormItem>

      <FormField
        control={form.control}
        name="schedulingNotes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              <>
                {getActivityFieldLabel(field.name)}
                <ActivityFieldInfoIcon
                  fieldKey="schedulingNotes"
                  ariaLabel="About scheduling and approval notes"
                />
              </>
            </FormLabel>
            <FormControl data-field={field.name}>
              <Textarea
                placeholder=""
                readOnly={readOnly}
                rows={4}
                maxLength={ACTIVITY_SCHEDULING_NOTES_MAX_LENGTH}
                {...field}
                value={field.value ?? ''}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </ActivityFormSection>
  );
}
