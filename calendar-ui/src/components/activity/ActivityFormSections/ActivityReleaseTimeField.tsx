import { useFormContext, useWatch } from 'react-hook-form';
import { useMemo } from 'react';

import type { ActivityFormData } from '@corpcal/shared/schemas';
import {
  computeActivityReleaseTimeInstant,
  formatReleaseTimeOffsetLabel,
  RELEASE_TIME_OFFSET_MAX_MINUTES,
  RELEASE_TIME_PRESET_OFFSETS,
} from '@corpcal/shared/utils';
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
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { getActivityFieldLabel } from '@/lib/activity-form-labels';
import { setActivityFormFieldValue } from '@/lib/activity-form-set-field';
import { formatExactDate } from '@/lib/datetime-utils';

import { ActivityFieldScopePermissionTooltip } from '../activity-field-scope-permission-tooltip';
import { ActivityFieldInfoIcon } from '../activity-info-icon-settings-context';
import { useActivityFieldScopeControl } from '../use-activity-field-scope-control';

type StatusLookupItem = { id: number; name: string };

type ActivityReleaseTimeFieldProps = {
  dateStatuses: StatusLookupItem[];
  timeStatuses: StatusLookupItem[];
};

type ReleaseTimeMode = 'unset' | 'preset' | 'custom';

function offsetToMode(offset: number | null | undefined): {
  mode: ReleaseTimeMode;
  preset?: number;
  custom?: number;
} {
  if (offset === null || offset === undefined) {
    return { mode: 'unset' };
  }
  if (RELEASE_TIME_PRESET_OFFSETS.includes(offset as 0 | 15 | 30)) {
    return { mode: 'preset', preset: offset };
  }
  return { mode: 'custom', custom: offset };
}

function formatInstantForDisplay(iso: string): string {
  return formatExactDate(iso, { includeTime: true });
}

export function ActivityReleaseTimeField({
  dateStatuses,
  timeStatuses,
}: ActivityReleaseTimeFieldProps) {
  const form = useFormContext<ActivityFormData>();
  const releaseScope = useActivityFieldScopeControl('releaseTime');
  const offsetValue = useWatch({
    control: form.control,
    name: 'releaseTimeOffsetMinutes',
  });
  const startDate = useWatch({ control: form.control, name: 'startDate' });
  const startTime = useWatch({ control: form.control, name: 'startTime' });
  const isAllDay = useWatch({ control: form.control, name: 'isAllDay' });
  const dateStatusId = useWatch({
    control: form.control,
    name: 'dateStatusId',
  });
  const timeStatusId = useWatch({
    control: form.control,
    name: 'timeStatusId',
  });

  const { mode, custom: customOffset } = offsetToMode(offsetValue);
  const customMinutes =
    mode === 'custom' && customOffset != null ? String(customOffset) : '';

  const dateStatusName = useMemo(
    () => dateStatuses.find((s) => s.id === dateStatusId)?.name,
    [dateStatuses, dateStatusId]
  );
  const timeStatusName = useMemo(
    () => timeStatuses.find((s) => s.id === timeStatusId)?.name,
    [timeStatuses, timeStatusId]
  );

  const computedInstant = useMemo(
    () =>
      computeActivityReleaseTimeInstant({
        releaseTimeOffsetMinutes: offsetValue ?? null,
        startDate: startDate ?? null,
        startTime: startTime ?? null,
        isAllDay: !!isAllDay,
        dateStatusName,
        timeStatusName,
      }),
    [
      offsetValue,
      startDate,
      startTime,
      isAllDay,
      dateStatusName,
      timeStatusName,
    ]
  );

  const UNSET_SELECT_VALUE = '__unset__';

  const selectValue =
    mode === 'unset'
      ? UNSET_SELECT_VALUE
      : mode === 'custom'
        ? 'custom'
        : String(offsetValue ?? '');

  const helperText = (() => {
    if (offsetValue === null || offsetValue === undefined) {
      return null;
    }
    if (computedInstant) {
      return `Calculated release time: ${formatInstantForDisplay(computedInstant)} (${formatReleaseTimeOffsetLabel(offsetValue)})`;
    }
    return 'Start time not confirmed';
  })();

  return (
    <FormField
      control={form.control}
      name="releaseTimeOffsetMinutes"
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            <>
              {getActivityFieldLabel(field.name)}
              <ActivityFieldInfoIcon
                fieldKey="releaseTimeOffsetMinutes"
                ariaLabel="About release time"
              />
            </>
          </FormLabel>
          <ActivityFieldScopePermissionTooltip scope="releaseTime">
            <div className="space-y-3">
              <FormSelectSafe
                readOnly={releaseScope.readOnly}
                disabled={releaseScope.fieldScopeDisabled}
                value={selectValue}
                onValueChange={(value) => {
                  if (value === UNSET_SELECT_VALUE) {
                    setActivityFormFieldValue(form, field.name, null);
                    return;
                  }
                  if (value === 'custom') {
                    const parsed = Number(customMinutes);
                    if (
                      Number.isInteger(parsed) &&
                      parsed >= 0 &&
                      parsed <= RELEASE_TIME_OFFSET_MAX_MINUTES
                    ) {
                      setActivityFormFieldValue(form, field.name, parsed);
                    } else {
                      setActivityFormFieldValue(form, field.name, 0);
                    }
                    return;
                  }
                  setActivityFormFieldValue(form, field.name, Number(value));
                }}
              >
                <FormControl data-field={field.name}>
                  <FormSelectTrigger
                    readOnly={
                      releaseScope.readOnly && !releaseScope.fieldScopeDisabled
                    }
                  >
                    <SelectValue placeholder="Select release time" />
                  </FormSelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={UNSET_SELECT_VALUE}>Not set</SelectItem>
                  <SelectItem value="0">At start</SelectItem>
                  <SelectItem value="15">+15 minutes</SelectItem>
                  <SelectItem value="30">+30 minutes</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </FormSelectSafe>

              {mode === 'custom' ? (
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    max={RELEASE_TIME_OFFSET_MAX_MINUTES}
                    step={1}
                    readOnly={releaseScope.readOnly}
                    disabled={releaseScope.fieldScopeDisabled}
                    placeholder="Minutes after scheduled start (max 7 days)"
                    value={customMinutes}
                    onChange={(e) => {
                      const next = e.target.value;
                      if (next === '') {
                        setActivityFormFieldValue(form, field.name, null);
                        return;
                      }
                      const parsed = Number(next);
                      if (
                        !Number.isInteger(parsed) ||
                        parsed < 0 ||
                        parsed > RELEASE_TIME_OFFSET_MAX_MINUTES
                      ) {
                        return;
                      }
                      setActivityFormFieldValue(form, field.name, parsed);
                    }}
                  />
                </FormControl>
              ) : null}

              {helperText ? (
                <p className="text-muted-foreground text-sm">{helperText}</p>
              ) : null}
            </div>
          </ActivityFieldScopePermissionTooltip>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
