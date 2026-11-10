import { useFormContext, useWatch } from 'react-hook-form';
import { useEffect, useMemo, useRef, useState } from 'react';

import type { ActivityFormData } from '@corpcal/shared/schemas';
import {
  applyReleaseSchedulingRadioChange,
  customPartsToReleaseTimeOffsetMinutes,
  getActivityReleaseTimePreview,
  getReleaseTimeOffsetMaxAmountForUnit,
  RELEASE_SCHEDULING_RADIO_CUSTOM,
  RELEASE_SCHEDULING_RADIO_NOT_SPECIFIED,
  RELEASE_SCHEDULING_RADIO_ON_SIGNAL,
  RELEASE_TIME_OFFSET_CUSTOM_UNITS,
  releaseSchedulingRadioValueFromFields,
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
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { getActivityFieldLabel } from '@/lib/activity-form-labels';
import { setActivityFormFieldValue } from '@/lib/activity-form-set-field';
import { cn } from '@/lib/utils';

import { ActivityFieldScopePermissionTooltip } from '../activity-field-scope-permission-tooltip';
import { ActivityFieldInfoIcon } from '../activity-info-icon-settings-context';
import { useActivityFieldScopeControl } from '../use-activity-field-scope-control';

const RELEASE_SCHEDULING_RADIO_OPTIONS = [
  { value: RELEASE_SCHEDULING_RADIO_NOT_SPECIFIED, label: 'Not specified' },
  { value: '0', label: 'At start' },
  { value: '15', label: '+15 minutes' },
  { value: '30', label: '+30 minutes' },
  { value: RELEASE_SCHEDULING_RADIO_CUSTOM, label: 'Custom' },
  { value: RELEASE_SCHEDULING_RADIO_ON_SIGNAL, label: 'On signal' },
] as const;

const RELEASE_TIME_OFFSET_UNIT_LABELS: Record<
  ReleaseTimeOffsetCustomUnit,
  string
> = {
  minutes: 'Minutes',
  hours: 'Hours',
  days: 'Days',
};

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
  const schedulingMode = useWatch({
    control: form.control,
    name: 'releaseSchedulingMode',
  });
  const offsetValue = useWatch({
    control: form.control,
    name: 'releaseTimeOffsetMinutes',
  });
  const startDate = useWatch({ control: form.control, name: 'startDate' });
  const startTime = useWatch({ control: form.control, name: 'startTime' });
  const isAllDay = useWatch({ control: form.control, name: 'isAllDay' });

  const radioValue = releaseSchedulingRadioValueFromFields(
    schedulingMode ?? null,
    offsetValue ?? null
  );

  const showCustomOffsetInput =
    radioValue === RELEASE_SCHEDULING_RADIO_CUSTOM &&
    schedulingMode !== 'on_signal';

  const [customDraft, setCustomDraft] =
    useState<CustomOffsetDraft>(EMPTY_CUSTOM_DRAFT);
  const customDraftRef = useRef(customDraft);
  customDraftRef.current = customDraft;

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

  const releasePreview = useMemo(
    () =>
      getActivityReleaseTimePreview({
        releaseSchedulingMode: schedulingMode ?? null,
        releaseTimeOffsetMinutes: offsetValue ?? null,
        startDate: startDate ?? null,
        startTime: startTime ?? null,
        isAllDay: !!isAllDay,
      }),
    [schedulingMode, offsetValue, startDate, startTime, isAllDay]
  );

  const helperText = releasePreview
    ? releasePreview.kind === 'preview'
      ? releasePreview.label
      : releasePreview.message
    : null;

  const customMaxAmount = getReleaseTimeOffsetMaxAmountForUnit(
    customDraft.unit
  );

  const applySchedulingFields = (update: {
    releaseSchedulingMode: ActivityFormData['releaseSchedulingMode'];
    releaseTimeOffsetMinutes: ActivityFormData['releaseTimeOffsetMinutes'];
  }) => {
    setActivityFormFieldValue(
      form,
      'releaseSchedulingMode',
      update.releaseSchedulingMode ?? null
    );
    setActivityFormFieldValue(
      form,
      'releaseTimeOffsetMinutes',
      update.releaseTimeOffsetMinutes ?? null
    );
  };

  const applyCustomDraft = (nextDraft: CustomOffsetDraft) => {
    setCustomDraft(nextDraft);
    const trimmed = nextDraft.amount.trim();
    if (trimmed === '') {
      applySchedulingFields({
        releaseSchedulingMode: 'relative',
        releaseTimeOffsetMinutes: null,
      });
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
    applySchedulingFields({
      releaseSchedulingMode: 'relative',
      releaseTimeOffsetMinutes: minutes,
    });
  };

  const applyCustomUnitChange = (nextUnit: ReleaseTimeOffsetCustomUnit) => {
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
      applySchedulingFields({
        releaseSchedulingMode: 'relative',
        releaseTimeOffsetMinutes: minutes,
      });
    }
  };

  return (
    <FormField
      control={form.control}
      name="releaseTimeOffsetMinutes"
      render={() => (
        <FormItem>
          <FormLabel>
            <>
              {getActivityFieldLabel('releaseTimeOffsetMinutes')}
              <ActivityFieldInfoIcon
                fieldKey="releaseTimeOffsetMinutes"
                ariaLabel="About release time"
              />
            </>
          </FormLabel>
          <ActivityFieldScopePermissionTooltip scope="releaseTime">
            <div className="space-y-3">
              <FormControl data-field="releaseSchedulingMode">
                <RadioGroup
                  readOnly={releaseScope.readOnly}
                  disabled={releaseScope.fieldScopeDisabled}
                  value={radioValue}
                  onValueChange={(value) => {
                    const next = applyReleaseSchedulingRadioChange(value);
                    if (value === RELEASE_SCHEDULING_RADIO_CUSTOM) {
                      setCustomDraft(customDraftFromOffset(offsetValue));
                    } else {
                      setCustomDraft(EMPTY_CUSTOM_DRAFT);
                    }
                    applySchedulingFields(next);
                  }}
                  className="flex flex-row flex-wrap gap-x-4 gap-y-2"
                >
                  {RELEASE_SCHEDULING_RADIO_OPTIONS.map((option) => (
                    <div
                      key={option.value || 'not-specified'}
                      className="flex items-center gap-2"
                    >
                      <RadioGroupItem
                        value={option.value}
                        id={`release-scheduling-${option.value || 'not-specified'}`}
                      />
                      <Label
                        htmlFor={`release-scheduling-${option.value || 'not-specified'}`}
                        className="cursor-pointer font-normal"
                      >
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </FormControl>

              {showCustomOffsetInput ? (
                <div className="space-y-1.5">
                  <FormControl data-field="releaseTimeOffsetMinutes">
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
                          applyCustomDraft({
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
