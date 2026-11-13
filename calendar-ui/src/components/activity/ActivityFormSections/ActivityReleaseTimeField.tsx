import { X } from 'lucide-react';
import { useFormContext, useWatch } from 'react-hook-form';
import { useEffect, useMemo, useRef, useState } from 'react';

import type { ActivityFormData } from '@corpcal/shared/schemas';
import {
  applyReleaseSchedulingRadioChange,
  customPartsToReleaseTimeOffsetMinutes,
  formatReleaseTimePreviewTriggerClock,
  getActivityReleaseTimePreview,
  getReleaseTimeOffsetMaxAmountForUnit,
  RELEASE_SCHEDULING_RADIO_CUSTOM,
  RELEASE_SCHEDULING_RADIO_NOT_SPECIFIED,
  RELEASE_SCHEDULING_RADIO_ON_SIGNAL,
  RELEASE_TIME_OFFSET_CUSTOM_UNITS,
  RELEASE_TIME_ON_SIGNAL_PREVIEW_MESSAGE,
  releaseSchedulingRadioValueFromFields,
  releaseTimeOffsetMinutesToCustomParts,
  releaseTimeOffsetMinutesToCustomPartsForUnit,
  type ReleaseSchedulingRadioValue,
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
import { filterPopoverMenuItemClass } from '@/components/users/filterPopoverMenuItemClasses';
import { getActivityFieldLabel } from '@/lib/activity-form-labels';
import { setActivityFormFieldValue } from '@/lib/activity-form-set-field';
import { cn } from '@/lib/utils';

import { ActivityFieldScopePermissionTooltip } from '../activity-field-scope-permission-tooltip';
import { ActivityFieldInfoIcon } from '../activity-info-icon-settings-context';
import { useActivityFieldScopeControl } from '../use-activity-field-scope-control';

const RELEASE_SCHEDULING_SELECT_OPTIONS = [
  { value: '0', label: 'At start time' },
  { value: '15', label: '15 minutes after' },
  { value: RELEASE_SCHEDULING_RADIO_ON_SIGNAL, label: 'On signal' },
  { value: RELEASE_SCHEDULING_RADIO_CUSTOM, label: 'Custom' },
] as const;

const RELEASE_SCHEDULING_SELECT_LABELS: Record<string, string> = {
  '0': 'At start time',
  '15': '15 minutes after',
  [RELEASE_SCHEDULING_RADIO_ON_SIGNAL]: 'On signal',
  [RELEASE_SCHEDULING_RADIO_CUSTOM]: 'Custom',
};

const RELEASE_TIME_OFFSET_UNIT_LABELS: Record<
  ReleaseTimeOffsetCustomUnit,
  string
> = {
  minutes: 'Minutes',
  hours: 'Hours',
  days: 'Days',
};

const RELEASE_TIME_FIELD_SUPPORT =
  'Release time is relative to start date and time.';

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

function schedulingSelectValueFromDerived(
  derived: ReleaseSchedulingRadioValue
): string {
  if (derived === RELEASE_SCHEDULING_RADIO_NOT_SPECIFIED) {
    return '';
  }
  return derived;
}

const RELEASE_SCHEDULING_OPTION_OFFSET_MINUTES: Partial<
  Record<string, number>
> = {
  '0': 0,
  '15': 15,
};

function releasePreviewClockForOffsetMinutes(
  minutes: number,
  schedule: {
    startDate: string | null | undefined;
    startTime: string | null | undefined;
    isAllDay: boolean;
  }
): string | null {
  return formatReleaseTimePreviewTriggerClock(
    getActivityReleaseTimePreview({
      releaseSchedulingMode: 'relative',
      releaseTimeOffsetMinutes: minutes,
      startDate: schedule.startDate ?? null,
      startTime: schedule.startTime ?? null,
      isAllDay: schedule.isAllDay,
    })
  );
}

function ReleaseSchedulingOptionMenuLabel({
  primaryLabel,
  previewClock,
}: {
  primaryLabel: string;
  previewClock: string | null;
}) {
  if (!previewClock) {
    return <span>{primaryLabel}</span>;
  }
  return (
    <span className="flex w-full min-w-0 items-center justify-between gap-3">
      <span className="truncate">{primaryLabel}</span>
      <span className="text-muted-foreground shrink-0">{previewClock}</span>
    </span>
  );
}

function ReleaseSchedulingSelectTriggerLabel({
  primaryLabel,
  previewClock,
}: {
  primaryLabel: string;
  previewClock: string | null;
}) {
  if (!previewClock) {
    return <span>{primaryLabel}</span>;
  }
  return (
    <span className="flex min-w-0 items-center gap-2">
      <span className="truncate">{primaryLabel}</span>
      <span className="text-muted-foreground truncate">{previewClock}</span>
    </span>
  );
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

  const derivedSchedulingValue = releaseSchedulingRadioValueFromFields(
    schedulingMode ?? null,
    offsetValue ?? null
  );

  const [customSelectPinned, setCustomSelectPinned] = useState(false);

  const selectValue = customSelectPinned
    ? RELEASE_SCHEDULING_RADIO_CUSTOM
    : schedulingSelectValueFromDerived(derivedSchedulingValue);

  const showCustomOffsetInput =
    selectValue === RELEASE_SCHEDULING_RADIO_CUSTOM &&
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

  const schedulePreviewContext = useMemo(
    () => ({
      startDate: startDate ?? null,
      startTime: startTime ?? null,
      isAllDay: !!isAllDay,
    }),
    [startDate, startTime, isAllDay]
  );

  const previewClock =
    schedulingMode === 'on_signal'
      ? null
      : formatReleaseTimePreviewTriggerClock(releasePreview);

  const customOffsetPreviewClock = useMemo(() => {
    const minutes = resolveCustomDraftOffsetMinutes(offsetValue, customDraft);
    if (minutes === null) {
      return null;
    }
    return releasePreviewClockForOffsetMinutes(minutes, schedulePreviewContext);
  }, [offsetValue, customDraft, schedulePreviewContext]);

  const triggerPreviewClock =
    selectValue === RELEASE_SCHEDULING_RADIO_CUSTOM
      ? customOffsetPreviewClock
      : selectValue === RELEASE_SCHEDULING_RADIO_ON_SIGNAL
        ? RELEASE_TIME_ON_SIGNAL_PREVIEW_MESSAGE
        : previewClock;

  const optionPreviewClockByValue = useMemo(() => {
    const clocks: Partial<Record<string, string | null>> = {
      [RELEASE_SCHEDULING_RADIO_ON_SIGNAL]:
        RELEASE_TIME_ON_SIGNAL_PREVIEW_MESSAGE,
    };
    for (const [value, minutes] of Object.entries(
      RELEASE_SCHEDULING_OPTION_OFFSET_MINUTES
    )) {
      if (minutes === undefined) continue;
      clocks[value] = releasePreviewClockForOffsetMinutes(
        minutes,
        schedulePreviewContext
      );
    }
    return clocks;
  }, [schedulePreviewContext]);

  const hintMessage =
    schedulingMode === 'on_signal'
      ? null
      : releasePreview?.kind === 'hint'
        ? releasePreview.message
        : null;

  const customMaxAmount = getReleaseTimeOffsetMaxAmountForUnit(
    customDraft.unit
  );

  const hasSchedulingValue =
    (schedulingMode !== null && schedulingMode !== undefined) ||
    (offsetValue !== null && offsetValue !== undefined);

  const canClear =
    hasSchedulingValue &&
    !releaseScope.readOnly &&
    !releaseScope.fieldScopeDisabled;

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

  const handleClear = () => {
    setCustomSelectPinned(false);
    setCustomDraft(EMPTY_CUSTOM_DRAFT);
    applySchedulingFields({
      releaseSchedulingMode: null,
      releaseTimeOffsetMinutes: null,
    });
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

  const primaryTriggerLabel = selectValue
    ? (RELEASE_SCHEDULING_SELECT_LABELS[selectValue] ?? 'Custom')
    : '';

  const fieldLabel = getActivityFieldLabel('releaseTimeOffsetMinutes');

  return (
    <FormField
      control={form.control}
      name="releaseTimeOffsetMinutes"
      render={() => (
        <FormItem>
          <FormLabel>
            <>
              {fieldLabel}
              <ActivityFieldInfoIcon
                fieldKey="releaseTimeOffsetMinutes"
                ariaLabel="About release time"
              />
            </>
          </FormLabel>
          <ActivityFieldScopePermissionTooltip scope="releaseTime">
            <div className="space-y-2">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                <div
                  className={cn(
                    'min-w-0 transition-[flex-grow,flex-basis,max-width] duration-200 ease-out motion-reduce:transition-none',
                    showCustomOffsetInput ? 'sm:flex-[0_0_50%]' : 'sm:flex-1'
                  )}
                >
                  <FormControl data-field="releaseSchedulingMode">
                    <FormSelectSafe
                      readOnly={releaseScope.readOnly}
                      disabled={releaseScope.fieldScopeDisabled}
                      optionValues={RELEASE_SCHEDULING_SELECT_OPTIONS.map(
                        (o) => o.value
                      )}
                      value={selectValue}
                      onValueChange={(value) => {
                        if (value === RELEASE_SCHEDULING_RADIO_CUSTOM) {
                          setCustomSelectPinned(true);
                          setCustomDraft(customDraftFromOffset(offsetValue));
                        } else {
                          setCustomSelectPinned(false);
                          setCustomDraft(EMPTY_CUSTOM_DRAFT);
                        }
                        applySchedulingFields(
                          applyReleaseSchedulingRadioChange(value)
                        );
                      }}
                    >
                      <FormSelectTrigger
                        readOnly={
                          releaseScope.readOnly &&
                          !releaseScope.fieldScopeDisabled
                        }
                        className="w-full"
                      >
                        <SelectValue placeholder="Not specified">
                          {selectValue ? (
                            <ReleaseSchedulingSelectTriggerLabel
                              primaryLabel={primaryTriggerLabel}
                              previewClock={triggerPreviewClock}
                            />
                          ) : null}
                        </SelectValue>
                      </FormSelectTrigger>
                      <SelectContent
                        footer={
                          canClear ? (
                            <>
                              <div className="border-t" />
                              <button
                                type="button"
                                className={cn(
                                  'text-muted-foreground flex w-full items-center gap-2 border-0 px-3 py-2 text-sm',
                                  filterPopoverMenuItemClass,
                                  'rounded-none focus-visible:rounded-none'
                                )}
                                aria-label={`Clear ${fieldLabel}`}
                                onPointerDown={(event) =>
                                  event.preventDefault()
                                }
                                onClick={handleClear}
                              >
                                <X className="h-3.5 w-3.5" />
                                Clear
                              </button>
                            </>
                          ) : undefined
                        }
                      >
                        {RELEASE_SCHEDULING_SELECT_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <ReleaseSchedulingOptionMenuLabel
                              primaryLabel={option.label}
                              previewClock={
                                optionPreviewClockByValue[option.value] ?? null
                              }
                            />
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </FormSelectSafe>
                  </FormControl>
                </div>

                {showCustomOffsetInput ? (
                  <div className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-left-1 min-w-0 duration-200 sm:flex-[0_0_50%]">
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
                          placeholder="Set time"
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
                  </div>
                ) : null}
              </div>

              <p className="text-muted-foreground text-xs">
                {RELEASE_TIME_FIELD_SUPPORT}
              </p>
              {hintMessage ? (
                <p className="text-muted-foreground text-sm">{hintMessage}</p>
              ) : null}
            </div>
          </ActivityFieldScopePermissionTooltip>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
