import { format, startOfDay } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';

import {
  ACTIVITY_FIELD_SCOPE_CONFIG,
  ACTIVITY_FIELD_SCOPES,
  canEditActivityFieldScope,
} from '@corpcal/shared/auth';
import {
  buildClonedTitle,
  CLONE_ADVANCED_FIELD_GROUPS,
  CLONE_ADVANCED_SECTIONS,
  CLONE_TITLE_MAX_LENGTH,
  type CloneActivityRequest,
  type CloneAdvancedSection,
} from '@corpcal/shared/schemas';
import { getActivityFieldLabel } from '@corpcal/shared/utils';
import {
  FormSelectSafe,
  FormSelectTrigger,
} from '@/components/app/form-select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ScheduledDatePopoverField } from '@/components/ui/scheduled-date-popover-field';
import { SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { TimePicker } from '@/components/ui/time-picker';
import {
  getPresetAnchorToday,
  parseIsoDateLocal,
  PRESETS_FUTURE_FROM_ANCHOR,
  PRESETS_PAST_FROM_ANCHOR,
} from '@/lib/scheduled-date-presets';

import { useAuth } from '../../../hooks/useAuth';
import type { FormLookupData } from '../../../hooks/useFormLookups';
import { ACTIVITY_FORM_SECTION_LABELS } from '../../../lib/activity-form-section-labels';

const NOT_CONFIRMED_STATUS_NAME = 'not_confirmed';

function resolveNotConfirmedStatusId<
  T extends { id: number; name: string; displayName: string },
>(statuses: T[]): number | undefined {
  const notConfirmedByName = statuses.find(
    (s) => s.name === NOT_CONFIRMED_STATUS_NAME
  );
  if (notConfirmedByName) return notConfirmedByName.id;
  const firstByDisplay = statuses[0];
  return firstByDisplay?.id;
}

const SECTION_LABELS: Record<CloneAdvancedSection, string> = {
  overview: ACTIVITY_FORM_SECTION_LABELS.overview,
  comms: ACTIVITY_FORM_SECTION_LABELS.comms,
  reports: ACTIVITY_FORM_SECTION_LABELS.reports,
  schedule: ACTIVITY_FORM_SECTION_LABELS.schedule,
  event: ACTIVITY_FORM_SECTION_LABELS.event,
  sharing: ACTIVITY_FORM_SECTION_LABELS.sharing,
};

/**
 * Map each clone advanced field path to the field-level scope that governs
 * edit permission. Unlisted paths are always allowed (no scope gating).
 */
const FIELD_PATH_TO_SCOPE: Record<string, string> = {};
for (const scope of ACTIVITY_FIELD_SCOPES) {
  for (const field of ACTIVITY_FIELD_SCOPE_CONFIG[scope].requestFields) {
    FIELD_PATH_TO_SCOPE[field] = scope;
  }
}

const STATUS_SELECT_MIN_WIDTH = 'min-w-[9rem]';
const INLINE_STATUS_FORM_ITEM_CLASS = 'shrink-0 space-y-0';
const PRIMARY_AND_STATUS_ROW_CLASS =
  'grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center';

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

export interface CloneActivityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceTitle: string;
  sourceDisplayId: string | null;
  lookups: FormLookupData;
  isSubmitting: boolean;
  /** When true, show "Mark as reviewed" (default checked), mirroring the create confirm flow. */
  showMarkAsReviewed?: boolean;
  onConfirm: (payload: CloneActivityRequest) => void;
}

export function CloneActivityModal({
  open,
  onOpenChange,
  sourceTitle,
  sourceDisplayId,
  lookups,
  isSubmitting,
  showMarkAsReviewed = false,
  onConfirm,
}: CloneActivityModalProps) {
  const { user } = useAuth();

  const defaultDateStatusId = useMemo(
    () => resolveNotConfirmedStatusId(lookups.dateStatuses),
    [lookups.dateStatuses]
  );
  const defaultTimeStatusId = useMemo(
    () => resolveNotConfirmedStatusId(lookups.timeStatuses),
    [lookups.timeStatuses]
  );

  const [title, setTitle] = useState(() => buildClonedTitle(sourceTitle));
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isAllDay, setIsAllDay] = useState(false);
  const [dateStatusId, setDateStatusId] = useState<number | undefined>(
    defaultDateStatusId
  );
  const [timeStatusId, setTimeStatusId] = useState<number | undefined>(
    defaultTimeStatusId
  );
  const [notes, setNotes] = useState('');
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [markAsReviewed, setMarkAsReviewed] = useState(true);
  const [activeTimePopover, setActiveTimePopover] = useState<
    'start' | 'end' | null
  >(null);

  const editableFieldGroups = useMemo<
    Record<CloneAdvancedSection, string[]>
  >(() => {
    const permissions = user?.permissions ?? [];
    const roleName = user?.roleName ?? '';
    const result = {} as Record<CloneAdvancedSection, string[]>;
    for (const section of CLONE_ADVANCED_SECTIONS) {
      result[section] = CLONE_ADVANCED_FIELD_GROUPS[section].filter((path) => {
        const scope = FIELD_PATH_TO_SCOPE[path];
        if (!scope) return true;
        return canEditActivityFieldScope(
          { permissions, roleName },
          scope as (typeof ACTIVITY_FIELD_SCOPES)[number]
        );
      });
    }
    return result;
  }, [user?.permissions, user?.roleName]);

  const editablePaths = useMemo(
    () =>
      CLONE_ADVANCED_SECTIONS.flatMap(
        (section) => editableFieldGroups[section]
      ),
    [editableFieldGroups]
  );

  const [includedPaths, setIncludedPaths] = useState<Set<string>>(
    () => new Set(editablePaths)
  );

  useEffect(() => {
    if (!open) return;
    setTitle(buildClonedTitle(sourceTitle));
    setStartDate('');
    setEndDate('');
    setStartTime('');
    setEndTime('');
    setIsAllDay(false);
    setDateStatusId(defaultDateStatusId);
    setTimeStatusId(defaultTimeStatusId);
    setNotes('');
    setShowMoreOptions(false);
    setMarkAsReviewed(true);
    setActiveTimePopover(null);
    setIncludedPaths(new Set(editablePaths));
  }, [
    open,
    sourceTitle,
    defaultDateStatusId,
    defaultTimeStatusId,
    editablePaths,
  ]);

  useEffect(() => {
    if (isAllDay) {
      setActiveTimePopover((prev) => (prev === 'end' ? null : prev));
    }
  }, [isAllDay]);

  const startStr = String(startDate ?? '');
  const endStr = String(endDate ?? '');
  const startTimeStr = String(startTime ?? '').trim();
  const endTimeStr = String(endTime ?? '').trim();

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

  const titleIsValid = title.trim().length > 0;
  const disableConfirm = isSubmitting || !titleIsValid;

  const togglePath = (path: string) => {
    setIncludedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const handleConfirm = () => {
    const payload: CloneActivityRequest = {
      title: title.trim(),
      startDate: startDate ? startDate : null,
      endDate: endDate ? endDate : null,
      startTime: isAllDay ? null : startTime ? startTime : null,
      endTime: isAllDay ? null : endTime ? endTime : null,
      isAllDay,
      dateStatusId,
      timeStatusId,
      includeFieldPaths: Array.from(includedPaths),
      activityHistoryNotes: notes.trim() || undefined,
      ...(showMarkAsReviewed ? { markAsReviewed } : {}),
    };
    onConfirm(payload);
  };

  const handleOpenChange = (value: boolean) => {
    if (isSubmitting && !value) return;
    onOpenChange(value);
  };

  const sourceDisplayLabel = sourceDisplayId ?? 'this activity';

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Clone activity</DialogTitle>
          <DialogDescription>
            Create a new activity using {sourceDisplayLabel} as a template.
            Review the title and schedule before confirming.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[65vh] space-y-5 overflow-y-auto pr-1">
          <div className="space-y-2">
            <Label htmlFor="clone-activity-title">
              {getActivityFieldLabel('title')}
            </Label>
            <Textarea
              id="clone-activity-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={CLONE_TITLE_MAX_LENGTH}
              rows={2}
              placeholder="Enter activity title"
              autoFocus
            />
            {!titleIsValid && (
              <p className="text-destructive text-sm font-medium">
                Title is required.
              </p>
            )}
          </div>

          <div className="space-y-3">
            <Label>Date</Label>
            <div className={PRIMARY_AND_STATUS_ROW_CLASS}>
              <div className="flex min-w-0 items-center gap-2">
                <div className="min-w-0 flex-1 space-y-0">
                  <Label className="sr-only">
                    {getActivityFieldLabel('startDate')}
                  </Label>
                  <ScheduledDatePopoverField
                    value={startDate}
                    onChange={(iso) => {
                      const next = iso || '';
                      setStartDate(next);
                      if (endDate && next && endDate < next) {
                        setEndDate(next);
                      }
                    }}
                    label={startButtonLabel}
                    triggerMuted={!startStr}
                    readOnly={false}
                    popoverTitle="Select start date"
                    presets={PRESETS_PAST_FROM_ANCHOR}
                    getPresetAnchor={getPresetAnchorToday}
                    triggerAriaLabel="Activity start date"
                    triggerVariant="form"
                    headerRight={
                      startStr ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-primary text-sm"
                          onClick={() => setStartDate('')}
                        >
                          Clear
                        </Button>
                      ) : null
                    }
                  />
                </div>
                <span className="text-muted-foreground shrink-0" aria-hidden>
                  →
                </span>
                <div className="min-w-0 flex-1 space-y-0">
                  <Label className="sr-only">
                    {getActivityFieldLabel('endDate')}
                  </Label>
                  <ScheduledDatePopoverField
                    value={endDate}
                    onChange={(iso) => setEndDate(iso || '')}
                    label={endButtonLabel}
                    triggerMuted={!endStr}
                    readOnly={false}
                    popoverTitle="Select end date"
                    presets={PRESETS_FUTURE_FROM_ANCHOR}
                    getPresetAnchor={endPresetAnchor}
                    isDateDisabled={isEndBeforeStart}
                    triggerAriaLabel="Activity end date"
                    triggerVariant="form"
                    headerRight={
                      endStr ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-primary text-sm"
                          onClick={() => setEndDate('')}
                        >
                          Clear
                        </Button>
                      ) : null
                    }
                  />
                </div>
              </div>
              <div className={INLINE_STATUS_FORM_ITEM_CLASS}>
                <Label htmlFor="clone-date-status" className="sr-only">
                  {getActivityFieldLabel('dateStatusId')}
                </Label>
                <FormSelectSafe
                  optionValues={lookups.dateStatuses.map((s) => String(s.id))}
                  value={dateStatusId != null ? String(dateStatusId) : ''}
                  onValueChange={(value) =>
                    setDateStatusId(value === '' ? undefined : Number(value))
                  }
                >
                  <FormSelectTrigger
                    id="clone-date-status"
                    className={STATUS_SELECT_MIN_WIDTH}
                    aria-label={getActivityFieldLabel('dateStatusId')}
                  >
                    <SelectValue placeholder="Date status" />
                  </FormSelectTrigger>
                  <SelectContent>
                    {lookups.dateStatuses.map((status) => (
                      <SelectItem key={status.id} value={String(status.id)}>
                        {status.displayName ?? status.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </FormSelectSafe>
              </div>
            </div>
            {hasDateOrderWarning ? (
              <p className="text-sm font-medium text-amber-700">
                End date must be later than or equal to start date.
              </p>
            ) : null}
          </div>

          <div className="space-y-3">
            <Label>Time</Label>
            <div className={PRIMARY_AND_STATUS_ROW_CLASS}>
              <div className="flex min-w-0 items-center gap-2">
                <div className="min-w-0 flex-1 space-y-0">
                  <Label className="sr-only">
                    {getActivityFieldLabel('startTime')}
                  </Label>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <TimePicker
                      allDay={{
                        isAllDay,
                        onAllDayChange: (checked) => setIsAllDay(checked),
                        label: getActivityFieldLabel('isAllDay'),
                      }}
                      ariaLabel="Activity start time"
                      readOnly={false}
                      placeholderMuted={
                        !isAllDay && !String(startTime ?? '').trim()
                      }
                      value={String(startTime ?? '')}
                      onChange={(next) =>
                        setStartTime(
                          next === undefined || next === '' ? '' : next
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
                  </div>
                </div>
                {!isAllDay ? (
                  <>
                    <span
                      className="text-muted-foreground shrink-0"
                      aria-hidden
                    >
                      →
                    </span>
                    <div className="min-w-0 flex-1 space-y-0">
                      <Label className="sr-only">
                        {getActivityFieldLabel('endTime')}
                      </Label>
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <TimePicker
                          allDay={{
                            isAllDay,
                            onAllDayChange: (checked) => setIsAllDay(checked),
                            label: getActivityFieldLabel('isAllDay'),
                          }}
                          ariaLabel="Activity end time"
                          readOnly={false}
                          placeholderMuted={!String(endTime ?? '').trim()}
                          value={String(endTime ?? '')}
                          onChange={(next) =>
                            setEndTime(
                              next === undefined || next === '' ? '' : next
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
                      </div>
                    </div>
                  </>
                ) : null}
              </div>
              <div className={INLINE_STATUS_FORM_ITEM_CLASS}>
                <Label htmlFor="clone-time-status" className="sr-only">
                  {getActivityFieldLabel('timeStatusId')}
                </Label>
                <FormSelectSafe
                  optionValues={lookups.timeStatuses.map((s) => String(s.id))}
                  value={timeStatusId != null ? String(timeStatusId) : ''}
                  onValueChange={(value) =>
                    setTimeStatusId(value === '' ? undefined : Number(value))
                  }
                >
                  <FormSelectTrigger
                    id="clone-time-status"
                    className={STATUS_SELECT_MIN_WIDTH}
                    aria-label={getActivityFieldLabel('timeStatusId')}
                  >
                    <SelectValue placeholder="Time status" />
                  </FormSelectTrigger>
                  <SelectContent>
                    {lookups.timeStatuses.map((status) => (
                      <SelectItem key={status.id} value={String(status.id)}>
                        {status.displayName ?? status.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </FormSelectSafe>
              </div>
            </div>
            {hasTimeOrderWarning ? (
              <p className="text-sm font-medium text-amber-700">
                End time must be later than start time.
              </p>
            ) : null}
          </div>

          <div className="space-y-3">
            <div className="flex">
              <button
                type="button"
                onClick={() => setShowMoreOptions((v) => !v)}
                className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                {showMoreOptions ? 'Hide options' : 'More options'}
              </button>
            </div>
            {showMoreOptions ? (
              <div className="space-y-3">
                <p className="text-sm font-medium">
                  Select fields to clone. Unchecked fields will be left empty.
                </p>
                <div className="space-y-4">
                  {CLONE_ADVANCED_SECTIONS.map((section) => {
                    const paths = editableFieldGroups[section];
                    if (paths.length === 0) return null;
                    return (
                      <div key={section} className="space-y-2">
                        <p className="text-xs font-semibold tracking-wide uppercase">
                          {SECTION_LABELS[section]}
                        </p>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {paths.map((path) => {
                            const id = `clone-include-${path}`;
                            return (
                              <div
                                key={path}
                                className="flex items-center gap-2"
                              >
                                <Checkbox
                                  id={id}
                                  checked={includedPaths.has(path)}
                                  onCheckedChange={() => togglePath(path)}
                                />
                                <Label
                                  htmlFor={id}
                                  className="cursor-pointer text-sm font-normal"
                                >
                                  {getActivityFieldLabel(path)}
                                </Label>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
            {showMarkAsReviewed ? (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="clone-confirm-mark-reviewed"
                  checked={markAsReviewed}
                  onCheckedChange={(checked) =>
                    setMarkAsReviewed(checked === true)
                  }
                />
                <Label
                  htmlFor="clone-confirm-mark-reviewed"
                  className="cursor-pointer text-sm font-normal"
                >
                  Mark as reviewed
                </Label>
              </div>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="clone-activity-notes">Add a note (optional)</Label>
            <Textarea
              id="clone-activity-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              maxLength={1000}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={disableConfirm}
          >
            {isSubmitting ? 'Cloning...' : 'Confirm'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
