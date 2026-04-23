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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

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

export interface CloneActivityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceTitle: string;
  sourceDisplayId: string | null;
  lookups: FormLookupData;
  isSubmitting: boolean;
  onConfirm: (payload: CloneActivityRequest) => void;
}

export function CloneActivityModal({
  open,
  onOpenChange,
  sourceTitle,
  sourceDisplayId,
  lookups,
  isSubmitting,
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
  const [showAdvanced, setShowAdvanced] = useState(false);

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
    setShowAdvanced(false);
    setIncludedPaths(new Set(editablePaths));
  }, [
    open,
    sourceTitle,
    defaultDateStatusId,
    defaultTimeStatusId,
    editablePaths,
  ]);

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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Clone activity</DialogTitle>
          <DialogDescription>
            Create a new activity using {sourceDisplayLabel} as a template.
            Review the title and schedule before confirming.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[65vh] space-y-5 overflow-y-auto pr-1">
          <div className="space-y-2">
            <Label htmlFor="clone-activity-title">Title</Label>
            <Input
              id="clone-activity-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={CLONE_TITLE_MAX_LENGTH}
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
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
              <div className="space-y-1">
                <Label
                  htmlFor="clone-start-date"
                  className="text-muted-foreground text-xs font-normal"
                >
                  Start date
                </Label>
                <Input
                  id="clone-start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    const v = e.target.value;
                    setStartDate(v);
                    if (endDate && v && endDate < v) {
                      setEndDate(v);
                    }
                  }}
                />
              </div>
              <div className="space-y-1">
                <Label
                  htmlFor="clone-end-date"
                  className="text-muted-foreground text-xs font-normal"
                >
                  End date
                </Label>
                <Input
                  id="clone-end-date"
                  type="date"
                  value={endDate}
                  min={startDate || undefined}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label
                  htmlFor="clone-date-status"
                  className="text-muted-foreground text-xs font-normal"
                >
                  Date status
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
                    className="min-w-36"
                    aria-label="Date status"
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
          </div>

          <div className="space-y-3">
            <Label>Time</Label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
              <div className="space-y-1">
                <Label
                  htmlFor="clone-start-time"
                  className="text-muted-foreground text-xs font-normal"
                >
                  Start time
                </Label>
                <Input
                  id="clone-start-time"
                  type="time"
                  value={startTime}
                  disabled={isAllDay}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label
                  htmlFor="clone-end-time"
                  className="text-muted-foreground text-xs font-normal"
                >
                  End time
                </Label>
                <Input
                  id="clone-end-time"
                  type="time"
                  value={endTime}
                  disabled={isAllDay}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label
                  htmlFor="clone-time-status"
                  className="text-muted-foreground text-xs font-normal"
                >
                  Time status
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
                    className="min-w-36"
                    aria-label="Time status"
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
            <div className="flex items-center gap-2">
              <Checkbox
                id="clone-is-all-day"
                checked={isAllDay}
                onCheckedChange={(checked) => setIsAllDay(checked === true)}
              />
              <Label
                htmlFor="clone-is-all-day"
                className="cursor-pointer text-sm font-normal"
              >
                All day
              </Label>
            </div>
          </div>

          <div className="space-y-2">
            {!showAdvanced && (
              <button
                type="button"
                onClick={() => setShowAdvanced(true)}
                className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                Advanced
              </button>
            )}
            {showAdvanced && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">
                    Fields to copy from the source
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(false)}
                    className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-800"
                  >
                    Hide
                  </button>
                </div>
                <p className="text-muted-foreground text-xs">
                  Unchecked fields start empty on the new activity.
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
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="clone-activity-notes">Add a note (optional)</Label>
            <Textarea
              id="clone-activity-notes"
              placeholder="Optional context; recorded on both activities' history."
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
