import { useFormContext, useWatch } from 'react-hook-form';
import { useEffect, useMemo, useRef, useState } from 'react';

import type { ActivityFormData } from '@corpcal/shared/schemas';
import {
  customPartsToReleaseTimeOffsetMinutes,
  getActivityReleaseTimePreview,
  getReleaseTimeOffsetMaxAmountForUnit,
  RELEASE_TIME_OFFSET_CUSTOM_UNITS,
  RELEASE_TIME_PRESET_OFFSETS,
  releaseTimeOffsetMinutesToCustomParts,
  releaseTimeOffsetMinutesToCustomPartsForUnit,
  type ReleaseTimeOffsetCustomUnit,
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
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { getActivityFieldLabel } from '@/lib/activity-form-labels';
import { setActivityFormFieldValue } from '@/lib/activity-form-set-field';
import { cn } from '@/lib/utils';

import { ActivityFieldScopePermissionTooltip } from '../activity-field-scope-permission-tooltip';
import { ActivityFieldInfoIcon } from '../activity-info-icon-settings-context';
import { useActivityFieldScopeControl } from '../use-activity-field-scope-control';

type ReleaseTimeMode = 'unset' | 'preset' | 'custom';

const RELEASE_TIME_OFFSET_UNIT_LABELS: Record<
  ReleaseTimeOffsetCustomUnit,
  string
> = {
  minutes: 'Minutes',
  hours: 'Hours',
  days: 'Days',
};

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

type CustomOffsetDraft = {
  amount: string;
  unit: ReleaseTimeOffsetCustomUnit;
};

const EMPTY_CUSTOM_DRAFT: CustomOffsetDraft = {
  amount: '',
  unit: 'minutes',
};

function customDraftFromOffset(
  offset: number | null | undefined
): CustomOffsetDraft {
  if (offset === null || offset === undefined) {
    return EMPTY_CUSTOM_DRAFT;
  }
  const parts = releaseTimeOffsetMinutesToCustomParts(offset);
  return { amount: String(parts.amount), unit: parts.unit };
}

function resolveCustomDraftOffsetMinutes(
  offsetValue: number | null | undefined,
  draft: CustomOffsetDraft
): number | null {
  if (offsetValue !== null && offsetValue !== undefined) {
    return offsetValue;
  }
  const trimmed = draft.amount.trim();
  if (trimmed === '') {
    return null;
  }
  const parsed = Number(trimmed);
  if (!Number.isInteger(parsed)) {
    return null;
  }
  return customPartsToReleaseTimeOffsetMinutes(parsed, draft.unit);
}

export function ActivityReleaseTimeField() {
  const form = useFormContext<ActivityFormData>();
  const releaseScope = useActivityFieldScopeControl('releaseTime');
  const offsetValue = useWatch({
    control: form.control,
    name: 'releaseTimeOffsetMinutes',
  });
  const startDate = useWatch({ control: form.control, name: 'startDate' });
  const startTime = useWatch({ control: form.control, name: 'startTime' });
  const isAllDay = useWatch({ control: form.control, name: 'isAllDay' });
  const { mode } = offsetToMode(offsetValue);
  const [customSelectActive, setCustomSelectActive] = useState(false);
  const [customDraft, setCustomDraft] =
    useState<CustomOffsetDraft>(EMPTY_CUSTOM_DRAFT);
  const customDraftRef = useRef(customDraft);
  customDraftRef.current = customDraft;

  const showCustomOffsetInput = customSelectActive || mode === 'custom';

  useEffect(() => {
    if (!showCustomOffsetInput) {
      return;
    }
    const draft = customDraftRef.current;
    const parsedAmount =
      draft.amount.trim() === '' ? null : Number(draft.amount);
    const draftMinutes =
      parsedAmount !== null && Number.isInteger(parsedAmount)
        ? customPartsToReleaseTimeOffsetMinutes(parsedAmount, draft.unit)
        : null;
    if (draftMinutes === offsetValue) {
      return;
    }
    setCustomDraft(customDraftFromOffset(offsetValue));
  }, [offsetValue, showCustomOffsetInput]);

  const selectMode: ReleaseTimeMode =
    customSelectActive || mode === 'custom'
      ? 'custom'
      : mode === 'unset'
        ? 'unset'
        : 'preset';

  const releasePreview = useMemo(
    () =>
      getActivityReleaseTimePreview({
        releaseTimeOffsetMinutes: offsetValue ?? null,
        startDate: startDate ?? null,
        startTime: startTime ?? null,
        isAllDay: !!isAllDay,
      }),
    [offsetValue, startDate, startTime, isAllDay]
  );

  const UNSET_SELECT_VALUE = '__unset__';

  const selectValue =
    selectMode === 'unset'
      ? UNSET_SELECT_VALUE
      : selectMode === 'custom'
        ? 'custom'
        : String(offsetValue ?? '');

  const helperText = releasePreview
    ? releasePreview.kind === 'preview'
      ? releasePreview.label
      : releasePreview.message
    : null;

  const customMaxAmount = getReleaseTimeOffsetMaxAmountForUnit(
    customDraft.unit
  );

  const applyCustomDraft = (
    fieldName: 'releaseTimeOffsetMinutes',
    nextDraft: CustomOffsetDraft
  ) => {
    setCustomDraft(nextDraft);
    const trimmed = nextDraft.amount.trim();
    if (trimmed === '') {
      setActivityFormFieldValue(form, fieldName, null);
      return;
    }
    const parsed = Number(trimmed);
    if (!Number.isInteger(parsed)) {
      return;
    }
    const minutes = customPartsToReleaseTimeOffsetMinutes(
      parsed,
      nextDraft.unit
    );
    if (minutes === null) {
      return;
    }
    setActivityFormFieldValue(form, fieldName, minutes);
  };

  const applyCustomUnitChange = (
    fieldName: 'releaseTimeOffsetMinutes',
    nextUnit: ReleaseTimeOffsetCustomUnit
  ) => {
    const baseMinutes = resolveCustomDraftOffsetMinutes(
      offsetValue,
      customDraft
    );
    if (baseMinutes === null) {
      setCustomDraft({ ...customDraft, unit: nextUnit });
      return;
    }
    const parts = releaseTimeOffsetMinutesToCustomPartsForUnit(
      baseMinutes,
      nextUnit
    );
    const minutes = customPartsToReleaseTimeOffsetMinutes(
      parts.amount,
      parts.unit
    );
    const nextDraft: CustomOffsetDraft = {
      amount: String(parts.amount),
      unit: parts.unit,
    };
    setCustomDraft(nextDraft);
    if (minutes !== null) {
      setActivityFormFieldValue(form, fieldName, minutes);
    }
  };

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
                    setCustomSelectActive(false);
                    setCustomDraft(EMPTY_CUSTOM_DRAFT);
                    setActivityFormFieldValue(form, field.name, null);
                    return;
                  }
                  if (value === 'custom') {
                    setCustomSelectActive(true);
                    setCustomDraft(customDraftFromOffset(offsetValue));
                    return;
                  }
                  setCustomSelectActive(false);
                  setCustomDraft(EMPTY_CUSTOM_DRAFT);
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

              {showCustomOffsetInput ? (
                <div className="space-y-1.5">
                  <FormControl data-field={field.name}>
                    <InputGroup
                      data-disabled={
                        releaseScope.fieldScopeDisabled ? true : undefined
                      }
                      className={cn(
                        releaseScope.fieldScopeDisabled &&
                          'pointer-events-none opacity-50'
                      )}
                    >
                      <InputGroupInput
                        type="number"
                        min={0}
                        max={customMaxAmount}
                        step={1}
                        readOnly={releaseScope.readOnly}
                        disabled={releaseScope.fieldScopeDisabled}
                        aria-label="Custom offset amount after scheduled start"
                        placeholder="Amount"
                        value={customDraft.amount}
                        onChange={(e) => {
                          applyCustomDraft(field.name, {
                            ...customDraft,
                            amount: e.target.value,
                          });
                        }}
                      />
                      <InputGroupAddon align="inline-end" className="pr-1">
                        <FormSelectSafe
                          readOnly={releaseScope.readOnly}
                          disabled={releaseScope.fieldScopeDisabled}
                          optionValues={[...RELEASE_TIME_OFFSET_CUSTOM_UNITS]}
                          value={customDraft.unit}
                          onValueChange={(unit) => {
                            applyCustomUnitChange(
                              field.name,
                              unit as ReleaseTimeOffsetCustomUnit
                            );
                          }}
                        >
                          <FormSelectTrigger
                            readOnly={
                              releaseScope.readOnly &&
                              !releaseScope.fieldScopeDisabled
                            }
                            className="h-8 w-29 border-0 bg-transparent shadow-none focus:ring-0"
                            aria-label="Custom offset unit"
                          >
                            <SelectValue />
                          </FormSelectTrigger>
                          <SelectContent align="end">
                            {RELEASE_TIME_OFFSET_CUSTOM_UNITS.map((unit) => (
                              <SelectItem key={unit} value={unit}>
                                {RELEASE_TIME_OFFSET_UNIT_LABELS[unit]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </FormSelectSafe>
                      </InputGroupAddon>
                    </InputGroup>
                  </FormControl>
                  <p className="text-muted-foreground text-xs">
                    After scheduled start (max 7 days)
                  </p>
                </div>
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
